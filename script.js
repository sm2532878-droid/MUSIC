// ============================================================
// MUSIC PLAYER
// ============================================================
// CATEGORY CLICK:
//     - changes the visible playlist
//     - DOES NOT stop current music
//     - DOES NOT pause current music
//
// SONG CLICK:
//     - plays the selected song
//
// MAIN MUSIC PLAYER:
//     - used ONLY for actual playback
//
// TEMPORARY PLAYLIST LOADER:
//     - used ONLY to read playlist contents
// ============================================================


// ============================================================
// PLAYLISTS
// ============================================================

const PLAYLISTS = {
    trending: "PLTmJDWl7vURc",
    old: "PLB-99MR-0VKY",
    new: "PLBMHGcJH7xRA",
    dance: "PLUmcJYD1Bzqg",
    bengali: "PLNi1KdnHfick"
};

const PLAYLIST_TITLES = {
    trending: "PURULIA",
    old: "OLD SONGS",
    new: "NEW SONGS",
    dance: "DANCE SONGS",
    bengali: "BENGALI SONGS"
};


// ============================================================
// GLOBAL STATE
// ============================================================

let currentCategory = "trending";

let player = null;

let youtubeReady = false;

let isPlaying = false;

let isMuted = false;


// Current playlist shown in the UI
let currentPlaylist = [];


// Current playing video ID
let currentVideoId = null;


// Current playing index inside the playlist being played
let currentPlayingIndex = -1;


// Prevent old category requests from updating the UI
let playlistRequestID = 0;


// Cache successfully loaded playlists
const playlistCache = {};


// Temporary loader player
let playlistLoader = null;


// ============================================================
// HTML ELEMENTS
// ============================================================

const playBtn =
    document.getElementById("playBtn");

const previousBtn =
    document.getElementById("previousBtn");

const nextBtn =
    document.getElementById("nextBtn");

const volumeBtn =
    document.getElementById("volumeBtn");

const progress =
    document.getElementById("progress");

const progressBar =
    document.getElementById("progressBar");

const currentTimeElement =
    document.getElementById("currentTime");

const durationElement =
    document.getElementById("duration");

const playlistItems =
    document.getElementById("playlistItems");

const playlistTitle =
    document.getElementById("playlistTitle");

const playlistCount =
    document.getElementById("playlistCount");

const trackTitle =
    document.getElementById("trackTitle");

const trackArtist =
    document.getElementById("trackArtist");

const categoryButtons =
    document.querySelectorAll(".category-btn");


// ============================================================
// CATEGORY UI
// ============================================================

function updateCategoryUI() {

    categoryButtons.forEach(function (button) {

        const category =
            button.dataset.category;

        button.classList.toggle(
            "active",
            category === currentCategory
        );

    });


    if (playlistTitle) {

        playlistTitle.textContent =
            PLAYLIST_TITLES[currentCategory];

    }

}


// ============================================================
// CATEGORY BUTTON EVENTS
// ============================================================

categoryButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const category =
                button.dataset.category;

            switchCategory(category);

        }
    );

});


// ============================================================
// LOAD YOUTUBE API
// ============================================================

function loadYouTubeAPI() {

    // Already available
    if (
        window.YT &&
        window.YT.Player
    ) {

        createMainPlayer();

        return;

    }


    // Already loading
    if (
        document.getElementById(
            "youtube-api-script"
        )
    ) {

        return;

    }


    const script =
        document.createElement("script");


    script.id =
        "youtube-api-script";


    script.src =
        "https://www.youtube.com/iframe_api";


    script.async =
        true;


    document.head.appendChild(
        script
    );

}


// ============================================================
// YOUTUBE API READY
// ============================================================

window.onYouTubeIframeAPIReady =
    function () {

        createMainPlayer();

    };


// ============================================================
// CREATE MAIN MUSIC PLAYER
// ============================================================

function createMainPlayer() {

    if (player) {
        return;
    }


    if (
        !window.YT ||
        !window.YT.Player
    ) {

        return;

    }


    const youtubeElement =
        document.getElementById(
            "youtube-player"
        );


    if (!youtubeElement) {

        console.error(
            "Missing #youtube-player"
        );

        return;

    }


    player =
        new YT.Player(
            "youtube-player",
            {

                width: "1",
                height: "1",

                playerVars: {

                    autoplay: 0,

                    controls: 0,

                    rel: 0,

                    playsinline: 1,

                    origin:
                        window.location.origin

                },

                events: {

                    onReady:
                        onMainPlayerReady,

                    onStateChange:
                        onMainPlayerStateChange,

                    onError:
                        onMainPlayerError

                }

            }
        );

}


// ============================================================
// MAIN PLAYER READY
// ============================================================

function onMainPlayerReady() {

    youtubeReady =
        true;


    updateCategoryUI();


    // Load first visible playlist.
    // This uses the separate loader,
    // NOT the main music player.

    loadCategoryPlaylist(
        currentCategory
    );

}


// ============================================================
// PLAYER READY
// ============================================================

function playerReady() {

    return (
        youtubeReady &&
        player !== null
    );

}


// ============================================================
// MAIN PLAYER STATE
// ============================================================

function onMainPlayerStateChange(event) {

    if (!window.YT) {
        return;
    }


    const state =
        event.data;


    // PLAYING
    if (
        state ===
        YT.PlayerState.PLAYING
    ) {

        isPlaying =
            true;


        if (playBtn) {

            playBtn.textContent =
                "❚❚";

        }


        updateCurrentVideoId();


        updateSongInformation();


        updateActiveSong();

    }


    // PAUSED
    else if (
        state ===
        YT.PlayerState.PAUSED
    ) {

        isPlaying =
            false;


        if (playBtn) {

            playBtn.textContent =
                "▶";

        }


        updateActiveSong();

    }


    // BUFFERING
    else if (
        state ===
        YT.PlayerState.BUFFERING
    ) {

        updateCurrentVideoId();

    }


    // ENDED
    else if (
        state ===
        YT.PlayerState.ENDED
    ) {

        isPlaying =
            false;


        if (playBtn) {

            playBtn.textContent =
                "▶";

        }


        updateActiveSong();

    }

}


// ============================================================
// MAIN PLAYER ERROR
// ============================================================

function onMainPlayerError(event) {

    console.error(
        "YouTube player error:",
        event.data
    );

}


// ============================================================
// PLAY / PAUSE
// ============================================================

if (playBtn) {

    playBtn.addEventListener(
        "click",
        function () {

            if (!playerReady()) {
                return;
            }


            if (isPlaying) {

                player.pauseVideo();

            } else {

                player.playVideo();

            }

        }
    );

}


// ============================================================
// MUTE / UNMUTE
// ============================================================

if (volumeBtn) {

    volumeBtn.addEventListener(
        "click",
        function () {

            if (!playerReady()) {
                return;
            }


            if (isMuted) {

                player.unMute();

                isMuted =
                    false;


                volumeBtn.textContent =
                    "🔊";

            } else {

                player.mute();

                isMuted =
                    true;


                volumeBtn.textContent =
                    "🔇";

            }

        }
    );

}


// ============================================================
// CATEGORY SWITCH
// ============================================================
//
// THIS FUNCTION DOES NOT TOUCH THE MAIN PLAYER.
//
// Therefore:
//
// PURULIA song playing
//        ↓
// click OLD SONGS
//        ↓
// OLD playlist appears
//        ↓
// PURULIA song keeps playing
//
// ============================================================

function switchCategory(category) {

    if (!PLAYLISTS[category]) {

        console.error(
            "Invalid category:",
            category
        );

        return;

    }


    if (
        category ===
        currentCategory
    ) {

        return;

    }


    console.log(
        "================================"
    );


    console.log(
        "CATEGORY:",
        currentCategory,
        "→",
        category
    );


    console.log(
        "CURRENT MUSIC WILL CONTINUE"
    );


    console.log(
        "================================"
    );


    // Change visible category only

    currentCategory =
        category;


    // New request ID

    playlistRequestID++;


    // Update navigation

    updateCategoryUI();


    // Show loading

    if (playlistItems) {

        playlistItems.innerHTML =
            `
            <div class="playlist-loading">
                LOADING ${PLAYLIST_TITLES[category]}...
            </div>
            `;

    }


    if (playlistCount) {

        playlistCount.textContent =
            "LOADING";

    }


    // If already cached, show immediately

    if (
        playlistCache[category] &&
        playlistCache[category].length > 0
    ) {

        displayPlaylist(
            playlistCache[category]
        );

        return;

    }


    // Otherwise load it using
    // a temporary separate YouTube player

    loadCategoryPlaylist(
        category
    );

}


// ============================================================
// LOAD CATEGORY PLAYLIST
// ============================================================

function loadCategoryPlaylist(category) {

    if (
        !window.YT ||
        !window.YT.Player
    ) {

        setTimeout(
            function () {

                loadCategoryPlaylist(
                    category
                );

            },
            300
        );

        return;

    }


    const requestID =
        playlistRequestID;


    const playlistID =
        PLAYLISTS[category];


    console.log(
        "LOADING PLAYLIST:",
        playlistID
    );


    createTemporaryPlaylistLoader(
        function (loader) {

            // Ignore if user changed category
            if (
                requestID !==
                playlistRequestID
            ) {

                destroyPlaylistLoader();

                return;

            }


            try {

                // IMPORTANT:
                // This affects ONLY the temporary loader.
                // It never touches the music player.

                loader.cuePlaylist({

                    listType:
                        "playlist",

                    list:
                        playlistID,

                    index:
                        0,

                    startSeconds:
                        0

                });

            }

            catch (error) {

                console.error(
                    "Playlist cue error:",
                    error
                );


                destroyPlaylistLoader();

                showPlaylistError();

                return;

            }


            checkTemporaryPlaylist(
                loader,
                category,
                requestID,
                0
            );

        }
    );

}


// ============================================================
// CREATE TEMPORARY PLAYLIST LOADER
// ============================================================

function createTemporaryPlaylistLoader(
    callback
) {

    // Destroy any previous loader first.
    destroyPlaylistLoader();


    const id =
        "playlist-loader-" +
        Date.now();


    const element =
        document.createElement("div");


    element.id =
        id;


    element.style.position =
        "fixed";

    element.style.left =
        "-10000px";

    element.style.top =
        "-10000px";

    element.style.width =
        "1px";

    element.style.height =
        "1px";

    element.style.opacity =
        "0";

    element.style.pointerEvents =
        "none";


    document.body.appendChild(
        element
    );


    try {

        playlistLoader =
            new YT.Player(
                id,
                {

                    width: "1",

                    height: "1",

                    playerVars: {

                        autoplay: 0,

                        controls: 0,

                        rel: 0,

                        playsinline: 1

                    },

                    events: {

                        onReady:
                            function () {

                                callback(
                                    playlistLoader
                                );

                            },

                        onError:
                            function (event) {

                                console.error(
                                    "Playlist loader error:",
                                    event.data
                                );

                            }

                    }

                }
            );

    }

    catch (error) {

        console.error(
            "Could not create playlist loader:",
            error
        );


        element.remove();


        playlistLoader =
            null;

    }

}


// ============================================================
// CHECK TEMPORARY PLAYLIST
// ============================================================

function checkTemporaryPlaylist(
    loader,
    category,
    requestID,
    attempt
) {

    // User changed category
    if (
        requestID !==
        playlistRequestID
    ) {

        destroyPlaylistLoader();

        return;

    }


    // Give up
    if (
        attempt >= 35
    ) {

        console.error(
            "Playlist failed:",
            category
        );


        destroyPlaylistLoader();


        showPlaylistError();


        return;

    }


    setTimeout(
        function () {

            // New request
            if (
                requestID !==
                playlistRequestID
            ) {

                destroyPlaylistLoader();

                return;

            }


            let list = [];


            try {

                list =
                    loader.getPlaylist() ||
                    [];

            }

            catch (error) {

                list = [];

            }


            console.log(
                "PLAYLIST CHECK:",
                category,
                "attempt:",
                attempt,
                "tracks:",
                list.length
            );


            if (
                list.length > 0
            ) {

                // Cache it

                playlistCache[category] =
                    list.slice();


                // Display it

                displayPlaylist(
                    list
                );


                // Remove temporary loader
                // after successful read

                destroyPlaylistLoader();


                return;

            }


            checkTemporaryPlaylist(
                loader,
                category,
                requestID,
                attempt + 1
            );

        },
        350
    );

}


// ============================================================
// DESTROY TEMPORARY LOADER
// ============================================================

function destroyPlaylistLoader() {

    if (
        playlistLoader &&
        typeof playlistLoader.destroy ===
        "function"
    ) {

        try {

            playlistLoader.destroy();

        }

        catch (error) {

            console.log(
                "Loader destroy error:",
                error
            );

        }

    }


    playlistLoader =
        null;


    const loaders =
        document.querySelectorAll(
            '[id^="playlist-loader-"]'
        );


    loaders.forEach(
        function (element) {

            element.remove();

        }
    );

}


// ============================================================
// DISPLAY PLAYLIST
// ============================================================

function displayPlaylist(
    videoIDs
) {

    if (!playlistItems) {
        return;
    }


    currentPlaylist =
        videoIDs.slice();


    playlistItems.innerHTML =
        "";


    if (playlistCount) {

        playlistCount.textContent =
            videoIDs.length +
            " TRACKS";

    }


    videoIDs.forEach(
        function (
            videoID,
            index
        ) {

            createPlaylistSong(
                videoID,
                index
            );

        }
    );


    updateActiveSong();

}


// ============================================================
// CREATE SONG ROW
// ============================================================

function createPlaylistSong(
    videoID,
    index
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "playlist-song";


    item.dataset.index =
        index;


    item.dataset.videoId =
        videoID;


    // Number

    const number =
        document.createElement(
            "div"
        );


    number.className =
        "song-number";


    number.textContent =
        String(
            index + 1
        ).padStart(
            2,
            "0"
        );


    // Details

    const details =
        document.createElement(
            "div"
        );


    details.className =
        "song-details";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "song-title";


    title.textContent =
        "Loading song...";


    const artist =
        document.createElement(
            "div"
        );


    artist.className =
        "song-artist";


    artist.textContent =
        "YouTube";


    details.appendChild(
        title
    );


    details.appendChild(
        artist
    );


    // Play icon

    const play =
        document.createElement(
            "div"
        );


    play.className =
        "song-play";


    play.textContent =
        "▶";


    // Add

    item.appendChild(
        number
    );


    item.appendChild(
        details
    );


    item.appendChild(
        play
    );


    playlistItems.appendChild(
        item
    );


    // ========================================================
    // CLICK SONG
    // ========================================================

    item.addEventListener(
        "click",
        function () {

            const clickedIndex =
                Number(
                    item.dataset.index
                );


            playSong(
                clickedIndex
            );

        }
    );


    // Load title

    getVideoInformation(
        videoID,
        title,
        artist
    );

}


// ============================================================
// PLAY SONG
// ============================================================

function playSong(index) {

    if (!playerReady()) {
        return;
    }


    if (
        index < 0 ||
        index >= currentPlaylist.length
    ) {

        return;

    }


    const videoID =
        currentPlaylist[index];


    currentPlayingIndex =
        index;


    currentVideoId =
        videoID;


    console.log(
        "PLAY SONG:",
        index + 1,
        videoID
    );


    // Only an explicit song click
    // changes the main music player.

    player.loadVideoById(
        {
            videoId:
                videoID,

            startSeconds:
                0

        }
    );


    isPlaying =
        true;


    if (playBtn) {

        playBtn.textContent =
            "❚❚";

    }


    updateActiveSong();


    updateSongInformation();

}


// ============================================================
// GET VIDEO INFORMATION
// ============================================================

function getVideoInformation(
    videoID,
    titleElement,
    artistElement
) {

    const url =
        "https://www.youtube.com/oembed" +
        "?url=" +
        encodeURIComponent(
            "https://www.youtube.com/watch?v=" +
            videoID
        ) +
        "&format=json";


    fetch(url)

        .then(
            function (response) {

                if (!response.ok) {

                    throw new Error(
                        "oEmbed error"
                    );

                }


                return response.json();

            }
        )

        .then(
            function (data) {

                titleElement.textContent =
                    data.title ||
                    "YouTube Song";


                artistElement.textContent =
                    data.author_name ||
                    "YouTube";

            }
        )

        .catch(
            function () {

                titleElement.textContent =
                    "YouTube Song";


                artistElement.textContent =
                    "YouTube";

            }
        );

}


// ============================================================
// UPDATE CURRENT VIDEO ID
// ============================================================

function updateCurrentVideoId() {

    if (!playerReady()) {
        return;
    }


    try {

        const data =
            player.getVideoData();


        if (
            data &&
            data.video_id
        ) {

            currentVideoId =
                data.video_id;


            const index =
                currentPlaylist.indexOf(
                    currentVideoId
                );


            if (
                index !== -1
            ) {

                currentPlayingIndex =
                    index;

            }

        }

    }

    catch (error) {

        return;

    }

}


// ============================================================
// UPDATE SONG INFO
// ============================================================

function updateSongInformation() {

    if (!playerReady()) {
        return;
    }


    try {

        const data =
            player.getVideoData();


        if (!data) {
            return;
        }


        if (trackTitle) {

            trackTitle.textContent =
                data.title ||
                "YouTube Music";

        }


        if (trackArtist) {

            trackArtist.textContent =
                data.author ||
                "YouTube";

        }

    }

    catch (error) {

        return;

    }

}


// ============================================================
// ACTIVE SONG
// ============================================================

function updateActiveSong() {

    if (!playlistItems) {
        return;
    }


    const songs =
        playlistItems.querySelectorAll(
            ".playlist-song"
        );


    songs.forEach(
        function (
            song,
            index
        ) {

            const button =
                song.querySelector(
                    ".song-play"
                );


            const songVideoID =
                song.dataset.videoId;


            const isCurrent =
                isPlaying &&
                songVideoID ===
                currentVideoId;


            if (isCurrent) {

                song.classList.add(
                    "active"
                );


                if (button) {

                    button.textContent =
                        "❚❚";

                }

            } else {

                song.classList.remove(
                    "active"
                );


                if (button) {

                    button.textContent =
                        "▶";

                }

            }

        }
    );

}


// ============================================================
// NEXT
// ============================================================

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        function () {

            if (!playerReady()) {
                return;
            }


            if (
                currentPlaylist.length ===
                0
            ) {

                return;

            }


            let nextIndex =
                currentPlayingIndex + 1;


            if (
                nextIndex >=
                currentPlaylist.length
            ) {

                nextIndex =
                    0;

            }


            playSong(
                nextIndex
            );

        }
    );

}


// ============================================================
// PREVIOUS
// ============================================================

if (previousBtn) {

    previousBtn.addEventListener(
        "click",
        function () {

            if (!playerReady()) {
                return;
            }


            if (
                currentPlaylist.length ===
                0
            ) {

                return;

            }


            let previousIndex =
                currentPlayingIndex - 1;


            if (
                previousIndex < 0
            ) {

                previousIndex =
                    currentPlaylist.length - 1;

            }


            playSong(
                previousIndex
            );

        }
    );

}


// ============================================================
// PROGRESS
// ============================================================

function updateProgress() {

    if (!playerReady()) {
        return;
    }


    try {

        const current =
            player.getCurrentTime();


        const duration =
            player.getDuration();


        if (
            !duration ||
            duration <= 0
        ) {

            return;

        }


        const percentage =
            (
                current /
                duration
            ) * 100;


        if (progressBar) {

            progressBar.style.width =
                Math.min(
                    100,
                    percentage
                ) +
                "%";

        }


        if (currentTimeElement) {

            currentTimeElement.textContent =
                formatTime(
                    current
                );

        }


        if (durationElement) {

            durationElement.textContent =
                formatTime(
                    duration
                );

        }

    }

    catch (error) {

        return;

    }

}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(seconds) {

    seconds =
        Math.floor(
            seconds || 0
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remaining =
        seconds % 60;


    return (
        String(
            minutes
        ).padStart(
            2,
            "0"
        ) +
        ":" +
        String(
            remaining
        ).padStart(
            2,
            "0"
        )
    );

}


// ============================================================
// PROGRESS CLICK
// ============================================================

if (progress) {

    progress.addEventListener(
        "click",
        function (event) {

            if (!playerReady()) {
                return;
            }


            const rect =
                progress.getBoundingClientRect();


            const percentage =
                Math.max(
                    0,
                    Math.min(
                        1,
                        (
                            event.clientX -
                            rect.left
                        ) /
                        rect.width
                    )
                );


            const duration =
                player.getDuration();


            if (
                !duration ||
                duration <= 0
            ) {

                return;

            }


            player.seekTo(
                duration *
                percentage,
                true
            );

        }
    );

}


// ============================================================
// KEYBOARD CONTROLS
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {

        const tag =
            event.target.tagName;


        if (
            tag === "INPUT" ||
            tag === "TEXTAREA"
        ) {

            return;

        }


        // SPACE

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();


            if (playBtn) {

                playBtn.click();

            }

        }


        // LEFT

        else if (
            event.key ===
            "ArrowLeft"
        ) {

            if (playerReady()) {

                player.seekTo(
                    Math.max(
                        0,
                        player.getCurrentTime() -
                        10
                    ),
                    true
                );

            }

        }


        // RIGHT

        else if (
            event.key ===
            "ArrowRight"
        ) {

            if (playerReady()) {

                const duration =
                    player.getDuration();


                player.seekTo(
                    Math.min(
                        duration,
                        player.getCurrentTime() +
                        10
                    ),
                    true
                );

            }

        }


        // N

        else if (
            event.key.toLowerCase() ===
            "n"
        ) {

            if (nextBtn) {

                nextBtn.click();

            }

        }


        // P

        else if (
            event.key.toLowerCase() ===
            "p"
        ) {

            if (previousBtn) {

                previousBtn.click();

            }

        }


        // M

        else if (
            event.key.toLowerCase() ===
            "m"
        ) {

            if (volumeBtn) {

                volumeBtn.click();

            }

        }

    }
);


// ============================================================
// PLAYLIST BOX OPEN / CLOSE
// ============================================================

const playlistPanel =
    document.getElementById(
        "playlistPanel"
    );


const playlistHeader =
    document.getElementById(
        "playlistHeader"
    );


if (
    playlistPanel &&
    playlistHeader
) {

    playlistHeader.addEventListener(
        "click",
        function () {

            playlistPanel.classList.toggle(
                "open"
            );

        }
    );

}


// ============================================================
// STATUS
// ============================================================

function showPlaylistError() {

    if (playlistItems) {

        playlistItems.innerHTML =
            `
            <div class="playlist-loading">
                UNABLE TO LOAD PLAYLIST
            </div>
            `;

    }


    if (playlistCount) {

        playlistCount.textContent =
            "ERROR";

    }

}


// ============================================================
// TIMERS
// ============================================================

setInterval(
    function () {

        updateProgress();

    },
    500
);


setInterval(
    function () {

        updateSongInformation();

    },
    1500
);


setInterval(
    function () {

        updateActiveSong();

    },
    1000
);


// ============================================================
// START
// ============================================================

updateCategoryUI();

loadYouTubeAPI();


// ============================================================
// DEBUG
// ============================================================

console.log(
    "================================"
);

console.log(
    "MUSIC PLAYER STARTED"
);

console.log(
    "PURULIA:",
    PLAYLISTS.trending
);

console.log(
    "OLD:",
    PLAYLISTS.old
);

console.log(
    "NEW:",
    PLAYLISTS.new
);

console.log(
    "DANCE:",
    PLAYLISTS.dance
);

console.log(
    "BENGALI:",
    PLAYLISTS.bengali
);

console.log(
    "================================"
);