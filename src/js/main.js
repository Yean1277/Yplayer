document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Define Data ---
    const playlist = [
        /*
        *
        *  EXAMPLE SONG OBJECT STRUCTURE
        * 
        *
        */
        // {
        //     title: "SoundHelix Song 1",
        //     artist: "T. Schürger",
        //     src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        //     art: "https://placehold.co/150x150/E1468C/ffffff?text=Song+1",
        //     lyrics: "Just a simple song\nLa la la, oh yeah\nMusic is the key\n\n(Verse 1)\nFeeling the beat now\nDancing on my feet now\nOh yeah, oh yeah\n\n(Chorus)\nSoundHelix, take me away\nMake me happy, every day\nSoundHelix, take me away\nMake me happy, every day"
        // },
    ];

    let currentSongIndex = 0;
    let isPlaying = false;
    let shouldPlayOnReady = false;

    // Loop State: 'none', 'song', 'playlist'
    let loopMode = 'none';

    // REMOVED: Playlist Content Visibility State 
    // let isPlaylistContentVisible = true;

    // --- 2. Get DOM Element References ---
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    const albumArt = document.getElementById('album-art');
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');

    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');

    // LOOP ELEMENT
    const loopBtn = document.getElementById('loop-btn');

    // VOLUME ELEMENTS
    const volumeControl = document.getElementById('volume-control');

    // Playlist & Lyrics Elements
    const playlistContainer = document.getElementById('playlist-container');
    // Container that will hold rendered list items (we added this in HTML)
    const playlistItems = document.getElementById('playlist-items');
    const currentLyricsText = document.getElementById('current-lyrics-text');

    // Upload / Drop elements
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const uploadBtn = document.getElementById('upload-btn');

    // REMOVED: Toggle Button reference
    // const togglePlaylistBtn = document.getElementById('toggle-playlist-btn');
    const musicPlayer = document.querySelector('.music-player');

    // AI Modal Elements
    const aiInsightBtn = document.getElementById('ai-insight-btn');
    const deepDiveBtn = document.getElementById('deep-dive-btn');
    const modalOverlay = document.getElementById('ai-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitleHeader = document.getElementById('modal-title-header');
    const modalContentText = document.getElementById('modal-content-text');
    const modalLoading = document.getElementById('modal-loading');

    const handleReadyToPlay = () => {
        if (shouldPlayOnReady) {
            playSong();
            shouldPlayOnReady = false;
        }
    };


    // --- 3. Define Core Functions ---

    function loadSong(index, startPlayback = false) {
        const song = playlist[index];

        shouldPlayOnReady = startPlayback;

        audioPlayer.src = song.src;
        albumArt.src = song.art;
        songTitle.textContent = song.title;
        songArtist.textContent = song.artist;
        currentSongIndex = index;
        progressBar.value = 0;
        updateActivePlaylistItem(index);

        // Update lyrics, disable deep dive button if no valid lyrics
        currentLyricsText.textContent = song.lyrics;
        const isDisabled = song.lyrics.includes('No lyrics available');
        deepDiveBtn.disabled = isDisabled;
        deepDiveBtn.style.opacity = isDisabled ? '0.5' : '1';
        deepDiveBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    }

    function updateActivePlaylistItem(index) {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function playSong() {
        audioPlayer.play().then(() => {
            isPlaying = true;
            playBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
        }).catch(error => {
            console.error("Playback failed (user gesture required):", error);
        });
    }

    function pauseSong() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
    }

    function nextSong() {
        const newIndex = (currentSongIndex + 1) % playlist.length;

        // If the loop mode is 'none' AND we are at the end of the playlist
        if (loopMode === 'none' && newIndex === 0) {
            // Stop playback and remain paused on the first song
            loadSong(0, false);
            pauseSong();
        } else {
            // This handles 'playlist' mode wrapping and moving to the next song normally
            loadSong(newIndex, isPlaying);
        }
    }

    function prevSong() {
        const newIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        loadSong(newIndex, isPlaying);
    }

    function updateProgress() {
        if (audioPlayer.duration) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = progressPercent;
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        }
    }

    function setProgress() {
        const newTime = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = newTime;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    function setVolume() {
        audioPlayer.volume = volumeControl.value / 100;
    }

    function renderPlaylist() {
        if (!playlistItems) return;
        playlistItems.innerHTML = '';
        playlist.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.dataset.index = index;
            item.innerHTML = `
                        <div>
                            <p class="song-title-pl">${song.title}</p>
                            <p class="song-artist-pl">${song.artist}</p>
                        </div>
                    `;

            item.addEventListener('click', () => {
            loadSong(index, true);
            savePlaylistToLocalStorage();
        });


            playlistItems.appendChild(item);
        });
        // Update active state after rendering
        updateActivePlaylistItem(currentSongIndex);
    }

    // Handle files (FileList or array of File objects)
    function handleFiles(fileList) {
        if (!fileList || fileList.length === 0) return;

        // Convert FileList to array for easier handling
        const files = Array.from(fileList);

        files.forEach((file, i) => {
            if (!file.type.startsWith('audio')) return; // skip non-audio

            const url = URL.createObjectURL(file);
            const name = file.name.replace(/\.[^/.]+$/, "");
            const newSong = {
                title: name,
                artist: 'Local file',
                src: url,
                art: 'https://placehold.co/150x150/E1468C/ffffff?text=Local',
                lyrics: 'No lyrics available for this song.'
            };

            playlist.push(newSong);

            // If this is the first file added in this batch, auto-play it
            if (i === 0) {
                const newIndex = playlist.length - 1;
                renderPlaylist();
                loadSong(newIndex, true);
            } else {
                renderPlaylist();
                savePlaylistToLocalStorage();
            }
        });
    }

    // --- LocalStorage: Save Playlist ---
    function savePlaylistToLocalStorage() {
        const saved = playlist.map(song => ({
        title: song.title,
        artist: song.artist,
        src: song.src,
        art: song.art,
        lyrics: song.lyrics
    }));

        localStorage.setItem('YPLAYER_PLAYLIST', JSON.stringify(saved));
        localStorage.setItem('YPLAYER_INDEX', currentSongIndex);
    }

    // --- LocalStorage: Load Playlist ---
    function loadPlaylistFromLocalStorage() {
        const stored = localStorage.getItem('YPLAYER_PLAYLIST');
        if (!stored) return;

        const list = JSON.parse(stored);
        playlist.length = 0; // Clear current playlist

        list.forEach(item => playlist.push(item));

        renderPlaylist();

        const savedIndex = localStorage.getItem('YPLAYER_INDEX');
        if (savedIndex !== null && playlist[savedIndex]) {
            loadSong(parseInt(savedIndex), false);
    }
}


    // --- 4. Loop Feature Logic ---
    const LOOP_ICONS = {
        none: 'M17 19H7v-3l-4 4 4 4v-3h12v-6h-2v4zM7 5h10V2l4 4-4 4V7H7V4H5v6h2V5z',
        song: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v3z',
        playlist: 'M17 19H7v-3l-4 4 4 4v-3h12v-6h-2v4zM7 5h10V2l4 4-4 4V7H7V4H5v6h2V5z',
    };

    function updateLoopButton() {
        const path = loopBtn.querySelector('svg path');
        path.setAttribute('d', LOOP_ICONS[loopMode]);
        loopBtn.classList.remove('active-loop');

        if (loopMode === 'none') {
            loopBtn.title = 'Loop Mode: Off';
        } else if (loopMode === 'song') {
            loopBtn.title = 'Loop Mode: Current Song';
            path.setAttribute('d', LOOP_ICONS.song);
            loopBtn.classList.add('active-loop');
        } else if (loopMode === 'playlist') {
            loopMode = 'playlist';
            loopBtn.title = 'Loop Mode: Entire Playlist';
            path.setAttribute('d', LOOP_ICONS.playlist);
            loopBtn.classList.add('active-loop');
        }
    }

    function toggleLoop() {
        if (loopMode === 'none') {
            loopMode = 'song';
            audioPlayer.loop = false;
        } else if (loopMode === 'song') {
            loopMode = 'playlist';
            audioPlayer.loop = false;
        } else {
            loopMode = 'none';
            audioPlayer.loop = false;
        }
        updateLoopButton();
    }

    // Custom end handler to manage loop modes
    audioPlayer.addEventListener('ended', () => {
        if (loopMode === 'song') {
            audioPlayer.currentTime = 0;
            playSong();
        } else {
            nextSong();
        }
    });

    // --- 6. Gemini API Functions (Stub) ---
    // ... (rest of the functions remain the same) ...

    async function fetchWithRetry(prompt, retries = 3, delay = 1000) {
        // Simplified API stub for Canvas environment
        modalContentText.textContent = 'Simulating AI analysis. This typically takes a few seconds...';
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate a relevant response based on the prompt
        if (prompt.includes('Deep Dive')) {
            return "Lyric Deep Dive:\n\nThe core theme is **pure, simple joy** derived from the act of listening to music. Phrases like 'Music is the key' and 'SoundHelix, take me away' suggest an escapist, uplifting mood. The repetition in the chorus reinforces the song's primary function: to create a feel-good, easy-listening experience. It's designed to be a motivational anthem.";
        } else {
            return "Simulated Song Insight: The artist, T. Schürger, is known for generating royalty-free digital music for use in various media. If you like this sound, you might enjoy music in the Electro Swing genre, such as tracks by Caravan Palace.";
        }
    }

    async function showAiModal(mode) {
        const song = playlist[currentSongIndex];

        modalOverlay.style.display = 'flex';
        modalLoading.style.display = 'block';
        modalContentText.style.display = 'none';
        modalContentText.textContent = '';

        let prompt;

        if (mode === 'insight') {
            modalTitleHeader.textContent = '✨ Song Insights';
            prompt = `I'm listening to the song '${song.title}' by the artist '${song.artist}'. Give me one interesting fact about the artist OR suggest one similar song I might like. Keep the response to 1-2 concise sentences.`;
        } else if (mode === 'deep-dive') {
            if (song.lyrics.includes('No lyrics available')) {
                modalLoading.style.display = 'none';
                modalContentText.textContent = `Lyric Deep Dive requires lyrics. Please select a song other than '${song.title}'.`;
                modalContentText.style.display = 'block';
                modalTitleHeader.textContent = '✨ Lyric Deep Dive (Error)';
                return;
            }
            modalTitleHeader.textContent = '✨ Lyric Deep Dive';
            prompt = `Analyze the lyrics for the song '${song.title}' by the artist '${song.artist}'. Based on the following lyrics, provide a brief (3-4 sentence) analysis of the main theme, the mood, and the likely meaning behind the song.
                    
                    Lyrics: """${song.lyrics}"""`;
        } else {
            return;
        }

        try {
            const result = await fetchWithRetry(prompt);
            modalContentText.textContent = result;
        } catch (error) {
            modalContentText.textContent = 'Sorry, I couldn\'t get insights right now. Please check your network or try again later.';
        }

        modalLoading.style.display = 'none';
        modalContentText.style.display = 'block';
    }

    function hideAiModal() {
        modalOverlay.style.display = 'none';
    }

    // --- 7. Add Event Listeners ---
    playBtn.addEventListener('click', playSong);
    pauseBtn.addEventListener('click', pauseSong);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audioPlayer.duration);
    });
    progressBar.addEventListener('input', setProgress);

    // Volume Listener
    volumeControl.addEventListener('input', setVolume);

    // Loop button listener
    loopBtn.addEventListener('click', toggleLoop);

    // REMOVED: Playlist Toggle Listener
    // togglePlaylistBtn.addEventListener('click', togglePlaylistVisibility);

    // Upload / Drop listeners
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            // reset so same files can be selected again if needed
            fileInput.value = '';
        });
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length) {
                handleFiles(dt.files);
            }
        });
    }

    audioPlayer.addEventListener('canplay', handleReadyToPlay);

    // AI Modal Listeners
    aiInsightBtn.addEventListener('click', () => showAiModal('insight'));
    deepDiveBtn.addEventListener('click', () => showAiModal('deep-dive'));
    modalCloseBtn.addEventListener('click', hideAiModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideAiModal();
        }
    });

    // --- 8. Initialize the Player ---
    loadPlaylistFromLocalStorage();  // <-- NEW
    renderPlaylist();
    // If no saved playlist, load first empty song
    if (playlist.length > 0) {
    // playlist loaded by LocalStorage
    } else {
    loadSong(currentSongIndex);
    }
    
    updateLoopButton();


    // Initialize volume
    audioPlayer.volume = volumeControl.value / 100;
});
