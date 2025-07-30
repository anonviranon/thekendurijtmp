// --- GLOBAL VARIABLES ---
let autoScrollInterval = null; // This will hold the interval for the auto-scroll.

// --- GLOBAL FUNCTIONS ---
// These are placed outside the main listener so the inline 'onclick' attributes in the HTML can access them.

/**
 * Toggles the visibility of a popup.
 * It also ensures all other popups are closed before opening a new one.
 * @param {string} popupId The ID of the popup element to toggle.
 */
function togglePopup(popupId) {
    const targetPopup = document.getElementById(popupId);
    if (!targetPopup) return; // Exit if the popup doesn't exist.

    const isVisible = targetPopup.classList.contains('active');
    const galaVideo = document.getElementById('gala-video');

    // Hide all popups first.
    document.querySelectorAll('.popup').forEach(popup => {
        popup.classList.remove('active');
        // If we are closing the rsvp popup, pause the video to save resources
        if (popup.id === 'rsvp-popup' && galaVideo) {
            galaVideo.pause();
        }
    });

    // If the target popup was not visible, show it.
    if (!isVisible) {
        targetPopup.classList.add('active');
        // If we are opening the rsvp popup, play the video
        if (popupId === 'rsvp-popup' && galaVideo) {
            galaVideo.currentTime = 0; // Rewind to start
            galaVideo.play().catch(error => {
                console.error("Video autoplay was blocked:", error);
                // This catch handles cases where the browser blocks autoplay.
                // The video will still be visible but won't play until the user interacts.
            });
        }
    }
    // If it was already visible, the loop above has already hidden it.
}


// --- MAIN APPLICATION LOGIC ---
// This function runs when the entire HTML page has loaded and is ready.
document.addEventListener('DOMContentLoaded', function() {

    // --- Element Selections ---
    const page1 = document.getElementById('page1');
    const staticRoseVideo = document.getElementById('static-rose');
    const bloomingRoseVideo = document.getElementById('blooming-rose-video');
    const backgroundMusic = document.getElementById('background-music');
    const scrollContainer = document.querySelector('.scroll-container');

    // --- Main Event Listeners ---

    // 1. Handles the initial click on the first rose video to start the experience.
    staticRoseVideo.addEventListener('click', function() {
        if (backgroundMusic) {
            backgroundMusic.play().catch(error => console.error("Audio playback failed:", error));
        }
        this.style.display = 'none';
        bloomingRoseVideo.style.display = 'block';
        bloomingRoseVideo.play();
    });

    // 2. This runs only after the blooming rose video has finished playing.
    bloomingRoseVideo.onended = function() {
        page1.style.opacity = '0';
        setTimeout(() => {
            page1.style.display = 'none';
        }, 1500);

        fetchGuestCount();
        generateCalendarLinks();
        startAutoScroll();
    };

    // --- Countdown Timer Logic ---
    setupCountdownTimer();


    // --- HELPER FUNCTIONS ---

    /**
     * Fetches registration data from a public Google Sheet and updates the guest count.
     */
    async function fetchGuestCount() {
        // The ID of your Google Sheet.
        const sheetId = '1mnLBSDFO8LUtXtMnjOHO-lf6KyVWz76flqortwXyoRw';
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const csvText = await response.text();
            const rows = csvText.trim().split('\n');
            const guestCount = rows.length > 1 ? rows.length - 1 : 0;
            document.getElementById('guest-count').innerText = guestCount;
        } catch (error) {
            console.error('Failed to fetch or process guest count:', error);
            document.getElementById('guest-count').innerText = '0';
        }
    }

    /**
     * Starts a slow, automatic scroll down the page.
     */
    function startAutoScroll() {
        if (autoScrollInterval) return;
        scrollContainer.addEventListener('wheel', stopAutoScroll, { once: true });
        scrollContainer.addEventListener('touchstart', stopAutoScroll, { once: true });
        scrollContainer.addEventListener('mousedown', stopAutoScroll, { once: true });

        autoScrollInterval = setInterval(() => {
            const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 1;
            if (!isAtBottom) {
                scrollContainer.scrollTop += 1;
            } else {
                stopAutoScroll();
            }
        }, 25);
    }

    /**
     * Stops the automatic scrolling.
     */
    function stopAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }

    /**
     * Generates the dynamic links for Google Calendar and the ICS file.
     */
    function generateCalendarLinks() {
        const eventDetails = {
            title: "Jamuan Kenduri KKTJMPPP",
            description: "Majlis Jamuan Kenduri Kesyukuran Kakitangan Jabatan Mufti Pulau Pinang",
            location: "Berjaya Penang Hotel, George Town, Penang, Malaysia",
            startDate: "20250927T060000Z",
            endDate: "20250927T140000Z",
        };
        const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${eventDetails.startDate}/${eventDetails.endDate}&details=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;
        const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyWebApp//EN', 'BEGIN:VEVENT', `UID:kenduri-kktjmppp-${new Date().getTime()}@example.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}`, `DTSTART:${eventDetails.startDate}`, `DTEND:${eventDetails.endDate}`, `SUMMARY:${eventDetails.title}`, `DESCRIPTION:${eventDetails.description}`, `LOCATION:${eventDetails.location}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        const icsUri = "data:text/calendar;charset=utf-8," + encodeURIComponent(icsContent);
        const googleEl = document.getElementById("google-cal-link");
        const icsEl = document.getElementById("ics-cal-link");
        googleEl.href = googleLink;
        googleEl.classList.remove("link-loading");
        icsEl.href = icsUri;
        icsEl.setAttribute('download', 'Majlis_Kenduri.ics');
        icsEl.classList.remove("link-loading");
    }

    /**
     * Sets up the interval to update the countdown timer every second.
     */
    function setupCountdownTimer() {
        const countdownDate = new Date("September 27, 2025 14:00:00").getTime();
        const timer = setInterval(function() {
            const now = new Date().getTime();
            const distance = countdownDate - now;
            if (distance < 0) {
                clearInterval(timer);
                document.getElementById("countdown-timer").innerHTML = "<h3>The day is here!</h3>";
                return;
            }
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            document.getElementById("days").innerText = String(d).padStart(2, '0');
            document.getElementById("hours").innerText = String(h).padStart(2, '0');
            document.getElementById("minutes").innerText = String(m).padStart(2, '0');
            document.getElementById("seconds").innerText = String(s).padStart(2, '0');
        }, 1000);
    }
});
