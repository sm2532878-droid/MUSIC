
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
// STATE
// ============================================================

// Playlist currently shown on screen
let currentCategory = "trending";

// Main YouTube music player
let player = null;

// Temporary playlist loader
let playlistLoader = null;

let youtubeReady = false;

let isPlaying = false;

let isMuted = false;


// ------------------------------------------------------------
// VISIBLE PLAYLIST
// ------------------------------------------------------------

let currentPlaylist = [];


// ------------------------------------------------------------
// ACTUALLY PLAYING PLAYLIST
// ------------------------------------------------------------
//
// IMPORTANT:
//
// This does NOT change when the user clicks another category.
//
// Example:
//
// PURULIA song playing
// user clicks OLD
//
// currentPlaylist = OLD
// playingPlaylist = PURULIA
//
// So when PURULIA song ends, the next PURULIA song plays.
// ------------------------------------------------------------

let playingPlaylist = [];

let playingCategory = null;

let currentVideoId = null;

let currentPlayingIndex = -1;


// ------------------------------------------------------------
// REQUEST CONTROL
// ------------------------------------------------------------

let playlistRequestID = 0;


// ------------------------------------------------------------
// CACHE
// ------------------------------------------------------------

const playlistCache = {};


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
// CATEGORY BUTTONS
// ============================================================

categoryButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            switchCategory(
                button.dataset.category
            );

        }
    );

});


// ============================================================
// LOAD YOUTUBE API
// ============================================================

function loadYouTubeAPI() {

    if (
        window.YT &&
        window.YT.Player
    ) {

        createMainPlayer();

        return;
    }

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

    script.async = true;

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
// CREATE MAIN PLAYER
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
                    playsinline: 1
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

    youtubeReady = true;

    updateCategoryUI();

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


    // ========================================================
    // PLAYING
    // ========================================================

    if (
        state ===
        YT.PlayerState.PLAYING
    ) {

        isPlaying = true;

        if (playBtn) {
            playBtn.textContent =
                "❚❚";
        }

        updateCurrentVideoId();

        updateSongInformation();

        updateActiveSong();

    }


    // ========================================================
    // PAUSED
    // ========================================================

    else if (
        state ===
        YT.PlayerState.PAUSED
    ) {

        isPlaying = false;

        if (playBtn) {
            playBtn.textContent =
                "▶";
        }

        updateActiveSong();

    }


    // ========================================================
    // BUFFERING
    // ========================================================

    else if (
        state ===
        YT.PlayerState.BUFFERING
    ) {

        updateCurrentVideoId();

    }


    // ========================================================
    // ENDED
    // ========================================================

    else if (
        state ===
        YT.PlayerState.ENDED
    ) {

        /*
         * IMPORTANT:
         *
         * Do NOT simply set isPlaying=false.
         *
         * Play the next song from the
         * playlist that is actually playing.
         */

        playNextSongAutomatically();

    }
}


// ============================================================
// YOUTUBE ERROR
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

                isMuted = false;

                volumeBtn.textContent =
                    "🔊";

            } else {

                player.mute();

                isMuted = true;

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
// IMPORTANT:
//
// The MAIN MUSIC PLAYER is NOT touched.
//
// No:
//     player.stopVideo()
//     player.pauseVideo()
//     player.cuePlaylist()
//     player.loadPlaylist()
//
// Therefore current song keeps playing.
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
        "CURRENT MUSIC CONTINUES"
    );

    console.log(
        "PLAYING CATEGORY:",
        playingCategory
    );

    console.log(
        "================================"
    );


    // Change visible category only

    currentCategory =
        category;


    playlistRequestID++;


    updateCategoryUI();


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


    // Use cache when available

    if (
        playlistCache[category] &&
        playlistCache[category].length > 0
    ) {

        displayPlaylist(
            playlistCache[category]
        );

        return;
    }


    // Load only the visible playlist

    loadCategoryPlaylist(
        category
    );
}


// ============================================================
// LOAD CATEGORY PLAYLIST
// ============================================================
//
// This creates a temporary invisible YouTube player.
//
// It NEVER controls the main music player.
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
        category,
        playlistID
    );


    createTemporaryPlaylistLoader(
        function (loader) {

            if (
                requestID !==
                playlistRequestID
            ) {

                destroyPlaylistLoader();

                return;
            }


            try {

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

            } catch (error) {

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

    destroyPlaylistLoader();


    const id =
        "playlist-loader-" +
        Date.now();


    const element =
        document.createElement(
            "div"
        );


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

    } catch (error) {

        console.error(
            "Playlist loader creation error:",
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

    if (
        requestID !==
        playlistRequestID
    ) {

        destroyPlaylistLoader();

        return;
    }


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

            } catch {

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

                // Cache playlist

                playlistCache[category] =
                    list.slice();


                // Display playlist

                displayPlaylist(
                    list
                );


                // Remove temporary loader

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

        } catch {
            // Ignore destroy error
        }

    }


    playlistLoader =
        null;


    document
        .querySelectorAll(
            '[id^="playlist-loader-"]'
        )
        .forEach(
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


    // ========================================================
    // NUMBER
    // ========================================================

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


    // ========================================================
    // DETAILS
    // ========================================================

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


    // ========================================================
    // PLAY ICON
    // ========================================================

    const play =
        document.createElement(
            "div"
        );


    play.className =
        "song-play";


    play.textContent =
        "▶";


    // ========================================================
    // APPEND
    // ========================================================

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
    // SONG CLICK
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


    // ========================================================
    // GET TITLE / ARTIST
    // ========================================================

    getVideoInformation(
        videoID,
        title,
        artist
    );
}


// ============================================================
// PLAY SELECTED SONG
// ============================================================
//
// This is where the "currently playing playlist"
// is saved.
//
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


    if (!videoID) {
        return;
    }


    // --------------------------------------------------------
    // IMPORTANT
    // --------------------------------------------------------
    //
    // Save the playlist that this song belongs to.
    //
    // Later, even if the user changes the navigation,
    // automatic NEXT will continue from this playlist.
    // --------------------------------------------------------

    playingPlaylist =
        currentPlaylist.slice();


    playingCategory =
        currentCategory;


    currentPlayingIndex =
        index;


    currentVideoId =
        videoID;


    console.log(
        "PLAYING:",
        playingCategory,
        "song:",
        index + 1,
        videoID
    );


    // Start selected video

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
// AUTO NEXT
// ============================================================
//
// This is the fix for:
// "next song doesn't play automatically"
//
// It uses PLAYING playlist,
// NOT the currently displayed playlist.
//
// ============================================================

function playNextSongAutomatically() {

    if (!playerReady()) {
        return;
    }


    if (
        playingPlaylist.length ===
        0
    ) {

        isPlaying =
            false;


        if (playBtn) {

            playBtn.textContent =
                "▶";

        }


        return;
    }


    const nextIndex =
        currentPlayingIndex + 1;


    // End of playlist
    if (
        nextIndex >=
        playingPlaylist.length
    ) {

        isPlaying =
            false;


        currentPlayingIndex =
            -1;


        if (playBtn) {

            playBtn.textContent =
                "▶";

        }


        updateActiveSong();

        return;
    }


    const nextVideoID =
        playingPlaylist[nextIndex];


    if (!nextVideoID) {
        return;
    }


    currentPlayingIndex =
        nextIndex;


    currentVideoId =
        nextVideoID;


    console.log(
        "AUTO NEXT:",
        playingCategory,
        "song:",
        nextIndex + 1
    );


    player.loadVideoById(
        {
            videoId:
                nextVideoID,

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
// MANUAL NEXT
// ============================================================
//
// Manual Next uses the playlist that is ACTUALLY playing.
// Not the playlist currently displayed.
// ============================================================

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        function () {

            if (!playerReady()) {
                return;
            }


            if (
                playingPlaylist.length ===
                0
            ) {

                return;
            }


            const nextIndex =
                currentPlayingIndex + 1;


            if (
                nextIndex >=
                playingPlaylist.length
            ) {

                return;
            }


            const nextVideoID =
                playingPlaylist[nextIndex];


            currentPlayingIndex =
                nextIndex;


            currentVideoId =
                nextVideoID;


            player.loadVideoById(
                {
                    videoId:
                        nextVideoID,

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
    );
}


// ============================================================
// MANUAL PREVIOUS
// ============================================================

if (previousBtn) {

    previousBtn.addEventListener(
        "click",
        function () {

            if (!playerReady()) {
                return;
            }


            if (
                playingPlaylist.length ===
                0
            ) {

                return;
            }


            const previousIndex =
                currentPlayingIndex - 1;


            if (
                previousIndex < 0
            ) {

                return;
            }


            const previousVideoID =
                playingPlaylist[
                    previousIndex
                ];


            currentPlayingIndex =
                previousIndex;


            currentVideoId =
                previousVideoID;


            player.loadVideoById(
                {
                    videoId:
                        previousVideoID,

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
    );
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


            // Find index inside the playlist
            // that is actually playing.

            const index =
                playingPlaylist.indexOf(
                    currentVideoId
                );


            if (
                index !== -1
            ) {

                currentPlayingIndex =
                    index;

            }

        }

    } catch {
        return;
    }
}


// ============================================================
// UPDATE SONG INFORMATION
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

    } catch {
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
        function (song) {

            const button =
                song.querySelector(
                    ".song-play"
                );


            const videoID =
                song.dataset.videoId;


            const active =
                isPlaying &&
                videoID ===
                currentVideoId;


            if (active) {

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
            ) *
            100;


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

    } catch {
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
// SEEK
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


            if (
                rect.width <= 0
            ) {

                return;
            }


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

                event.preventDefault();


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

                event.preventDefault();


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
// ERROR DISPLAY
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
    updateProgress,
    500
);


setInterval(
    updateSongInformation,
    1500
);


setInterval(
    updateActiveSong,
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