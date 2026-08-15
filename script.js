// ============================================================
// MUSIC PLAYER
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

let currentCategory = "trending";

let player = null;
let playlistLoader = null;

let youtubeReady = false;
let isPlaying = false;
let isMuted = false;

let currentPlaylist = [];

let playingPlaylist = [];
let playingCategory = null;
let currentVideoId = null;
let currentPlayingIndex = -1;

let playlistRequestID = 0;

const playlistCache = {};


// ============================================================
// ELEMENTS
// ============================================================

const playBtn = document.getElementById("playBtn");
const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");
const volumeBtn = document.getElementById("volumeBtn");

const progress = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");

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
// VISUALIZER
// ============================================================

function createVisualizer() {

    const musicPlayer =
        document.querySelector(".music-player");

    if (!musicPlayer) {
        return;
    }

    if (document.getElementById("visualizer")) {
        return;
    }

    const visualizer =
        document.createElement("div");

    visualizer.id = "visualizer";
    visualizer.className = "visualizer";

    for (let i = 0; i < 15; i++) {

        const bar =
            document.createElement("span");

        bar.style.animationDelay =
            `${i * 0.08}s`;

        visualizer.appendChild(bar);
    }

    musicPlayer.appendChild(
        visualizer
    );
}

function setVisualizerPlaying(playing) {

    const musicPlayer =
        document.querySelector(".music-player");

    if (!musicPlayer) {
        return;
    }

    musicPlayer.classList.toggle(
        "playing",
        playing
    );
}


// ============================================================
// CATEGORY UI
// ============================================================

function updateCategoryUI() {

    categoryButtons.forEach(
        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.category ===
                currentCategory
            );

        }
    );

    if (playlistTitle) {

        playlistTitle.textContent =
            PLAYLIST_TITLES[currentCategory];

    }
}


// ============================================================
// CATEGORY BUTTONS
// ============================================================

categoryButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                switchCategory(
                    button.dataset.category
                );

            }
        );

    }
);


// ============================================================
// YOUTUBE API
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

window.onYouTubeIframeAPIReady =
    function () {

        createMainPlayer();

    };


// ============================================================
// MAIN PLAYER
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

    const element =
        document.getElementById(
            "youtube-player"
        );

    if (!element) {

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
                        onPlayerReady,

                    onStateChange:
                        onPlayerStateChange,

                    onError:
                        onPlayerError
                }
            }
        );

}


// ============================================================
// PLAYER READY
// ============================================================

function onPlayerReady() {

    youtubeReady = true;

    updateCategoryUI();

    createVisualizer();

    loadCategoryPlaylist(
        currentCategory
    );
}


// ============================================================
// READY CHECK
// ============================================================

function playerReady() {

    return (
        youtubeReady &&
        player !== null
    );
}


// ============================================================
// PLAYER STATE
// ============================================================

function onPlayerStateChange(event) {

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

        isPlaying = true;

        if (playBtn) {
            playBtn.textContent =
                "❚❚";
        }

        setVisualizerPlaying(true);

        updateCurrentVideoId();
        updateSongInformation();
        updateActiveSong();
    }


    // PAUSED
    else if (
        state ===
        YT.PlayerState.PAUSED
    ) {

        isPlaying = false;

        if (playBtn) {
            playBtn.textContent =
                "▶";
        }

        setVisualizerPlaying(false);

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

        playNextSongAutomatically();
    }

}


// ============================================================
// PLAYER ERROR
// ============================================================

function onPlayerError(event) {

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
// MUTE
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

function switchCategory(category) {

    if (!PLAYLISTS[category]) {
        return;
    }

    if (
        category ===
        currentCategory
    ) {
        return;
    }

    currentCategory =
        category;

    playlistRequestID++;

    updateCategoryUI();

    if (playlistItems) {

        playlistItems.innerHTML = `
            <div class="playlist-loading">
                LOADING ${PLAYLIST_TITLES[category]}...
            </div>
        `;

    }

    if (playlistCount) {
        playlistCount.textContent =
            "LOADING";
    }

    // IMPORTANT:
    // The main player is NOT touched.

    if (
        playlistCache[category] &&
        playlistCache[category].length
    ) {

        displayPlaylist(
            playlistCache[category]
        );

        return;
    }

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
                loadCategoryPlaylist(category);
            },
            300
        );

        return;
    }

    const requestID =
        playlistRequestID;

    const playlistID =
        PLAYLISTS[category];

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
                    "Playlist error:",
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
// TEMPORARY PLAYLIST LOADER
// ============================================================

function createTemporaryPlaylistLoader(
    callback
) {

    destroyPlaylistLoader();

    const id =
        "playlist-loader-" +
        Date.now();

    const element =
        document.createElement("div");

    element.id =
        id;

    Object.assign(
        element.style,
        {
            position: "fixed",
            left: "-10000px",
            top: "-10000px",
            width: "1px",
            height: "1px",
            opacity: "0",
            pointerEvents: "none"
        }
    );

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
            "Loader creation error:",
            error
        );

        element.remove();

        playlistLoader =
            null;
    }
}


// ============================================================
// CHECK PLAYLIST
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

    if (attempt >= 35) {

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

            if (list.length > 0) {

                playlistCache[category] =
                    list.slice();

                displayPlaylist(list);

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
// DESTROY LOADER
// ============================================================

function destroyPlaylistLoader() {

    if (
        playlistLoader &&
        typeof playlistLoader.destroy ===
        "function"
    ) {

        try {
            playlistLoader.destroy();
        } catch {}
    }

    playlistLoader = null;

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

function displayPlaylist(videoIDs) {

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
        function (videoID, index) {

            createPlaylistSong(
                videoID,
                index
            );

        }
    );

    updateActiveSong();
}


// ============================================================
// CREATE SONG
// ============================================================

function createPlaylistSong(
    videoID,
    index
) {

    const item =
        document.createElement("div");

    item.className =
        "playlist-song";

    item.dataset.index =
        index;

    item.dataset.videoId =
        videoID;


    // Number

    const number =
        document.createElement("div");

    number.className =
        "song-number";

    number.textContent =
        String(index + 1)
            .padStart(2, "0");


    // Details

    const details =
        document.createElement("div");

    details.className =
        "song-details";


    const title =
        document.createElement("div");

    title.className =
        "song-title";

    title.textContent =
        "Loading song...";


    const artist =
        document.createElement("div");

    artist.className =
        "song-artist";

    artist.textContent =
        "YouTube";


    details.appendChild(title);
    details.appendChild(artist);


    // Play icon

    const play =
        document.createElement("div");

    play.className =
        "song-play";

    play.textContent =
        "▶";


    item.appendChild(number);
    item.appendChild(details);
    item.appendChild(play);

    playlistItems.appendChild(item);


    // Song click

    item.addEventListener(
        "click",
        function () {

            playSong(
                index
            );

        }
    );


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

    if (!videoID) {
        return;
    }


    // Save the playlist that is ACTUALLY playing

    playingPlaylist =
        currentPlaylist.slice();

    playingCategory =
        currentCategory;

    currentPlayingIndex =
        index;

    currentVideoId =
        videoID;


    player.loadVideoById({
        videoId:
            videoID,

        startSeconds:
            0
    });


    isPlaying = true;

    if (playBtn) {
        playBtn.textContent =
            "❚❚";
    }

    setVisualizerPlaying(true);

    updateActiveSong();
    updateSongInformation();
}


// ============================================================
// AUTO NEXT
// ============================================================

function playNextSongAutomatically() {

    if (!playerReady()) {
        return;
    }

    if (
        playingPlaylist.length === 0
    ) {

        isPlaying = false;

        setVisualizerPlaying(false);

        if (playBtn) {
            playBtn.textContent =
                "▶";
        }

        return;
    }

    const nextIndex =
        currentPlayingIndex + 1;


    // End of playing playlist

    if (
        nextIndex >=
        playingPlaylist.length
    ) {

        isPlaying = false;

        currentPlayingIndex = -1;

        setVisualizerPlaying(false);

        if (playBtn) {
            playBtn.textContent =
                "▶";
        }

        updateActiveSong();

        return;
    }


    const nextVideo =
        playingPlaylist[nextIndex];


    currentPlayingIndex =
        nextIndex;

    currentVideoId =
        nextVideo;


    player.loadVideoById({
        videoId:
            nextVideo,

        startSeconds:
            0
    });


    isPlaying = true;

    setVisualizerPlaying(true);

    if (playBtn) {
        playBtn.textContent =
            "❚❚";
    }

    updateSongInformation();
    updateActiveSong();
}


// ============================================================
// NEXT BUTTON
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

            currentPlayingIndex =
                nextIndex;

            currentVideoId =
                playingPlaylist[nextIndex];

            player.loadVideoById({
                videoId:
                    currentVideoId,

                startSeconds:
                    0
            });

            isPlaying = true;

            setVisualizerPlaying(true);

        }
    );

}


// ============================================================
// PREVIOUS BUTTON
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

            currentPlayingIndex =
                previousIndex;

            currentVideoId =
                playingPlaylist[
                    previousIndex
                ];

            player.loadVideoById({
                videoId:
                    currentVideoId,

                startSeconds:
                    0
            });

            isPlaying = true;

            setVisualizerPlaying(true);

        }
    );

}


// ============================================================
// VIDEO INFO
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
// CURRENT VIDEO ID
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
                playingPlaylist.indexOf(
                    currentVideoId
                );

            if (index !== -1) {

                currentPlayingIndex =
                    index;

            }
        }

    } catch {}
}


// ============================================================
// SONG INFORMATION
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

    } catch {}
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

            const active =
                isPlaying &&
                song.dataset.videoId ===
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
                formatTime(current);

        }

        if (durationElement) {

            durationElement.textContent =
                formatTime(duration);

        }

    } catch {}
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
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
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

            if (rect.width <= 0) {
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
// KEYBOARD
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


        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            if (playBtn) {
                playBtn.click();
            }

        }


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


        else if (
            event.key.toLowerCase() ===
            "n"
        ) {

            if (nextBtn) {
                nextBtn.click();
            }

        }


        else if (
            event.key.toLowerCase() ===
            "p"
        ) {

            if (previousBtn) {
                previousBtn.click();
            }

        }


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
// PLAYLIST BOX
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
// ERROR
// ============================================================

function showPlaylistError() {

    if (playlistItems) {

        playlistItems.innerHTML = `
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