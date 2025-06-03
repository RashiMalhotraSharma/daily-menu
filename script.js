// Make sure to include menuData.js *before* script.js in your HTML:
// <script src="menuData.js"></script>
// <script src="script.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const dateDayElement = document.getElementById('date-day');
    const breakfastItemTextElement = document.getElementById('breakfast-text');
    const lunchItemTextElement = document.getElementById('lunch-text');
    const dinnerItemTextElement = document.getElementById('dinner-text');

    const snackItemElement = document.getElementById('snack-item');
    const dessertItemElement = document.getElementById('dessert-item');

    const snackSectionWrapper = document.getElementById('snack-section-wrapper');
    const dessertSectionWrapper = document.getElementById('dessert-section-wrapper');

    const showSnackBtn = document.getElementById('show-snack-btn');
    const showDessertBtn = document.getElementById('show-dessert-btn');

    const easyBreakfastBtn = document.getElementById('easy-breakfast-btn');
    const easyLunchBtn = document.getElementById('easy-lunch-btn');
    const easyDinnerBtn = document.getElementById('easy-dinner-btn');

    // --- Global variable to hold the current day's menu and its state ---
    let currentDailyMenu = {
        date: null,
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
        dessert: null,
        breakfastEasyUsed: false, // Flag to indicate if easy option was picked for breakfast
        lunchEasyUsed: false,
        dinnerEasyUsed: false,
        snackShown: false,      // Flag to indicate if snack section was made visible
        dessertShown: false     // Flag to indicate if dessert section was made visible
    };


    // --- Helper Functions for LocalStorage ---

    /**
     * Saves the currentDailyMenu object to localStorage.
     */
    function saveDailyMenuToLocalStorage() {
        try {
            localStorage.setItem('dailyMenu_data', JSON.stringify(currentDailyMenu));
        } catch (e) {
            console.error("Failed to save menu to localStorage:", e);
        }
    }

    /**
     * Loads the daily menu data from localStorage.
     * @returns {object|null} The parsed menu data or null if not found/invalid.
     */
    function loadDailyMenuFromLocalStorage() {
        try {
            const storedData = localStorage.getItem('dailyMenu_data');
            if (storedData) {
                const loaded = JSON.parse(storedData);
                // Basic validation: ensure it has expected properties to prevent errors from old/corrupt data
                if (loaded && loaded.date && loaded.breakfast !== undefined) { // Check for a core property
                    return loaded;
                }
            }
        } catch (e) {
            console.error("Failed to load/parse menu from localStorage:", e);
        }
        return null;
    }


    // --- Core Menu Generation/Display Logic ---

    /**
     * Gets a random menu item from a list, ensuring it hasn't been displayed in the last week.
     * Updates and saves the display history in localStorage.
     * @param {Array<string>} items - The array of menu items to choose from.
     * @param {string} mealTypeKey - The key used for localStorage history (e.g., 'breakfast', 'easyBreakfast').
     * @returns {string} The randomly selected menu item.
     */
    function getRandomMenuItem(items, mealTypeKey) {
        if (!items || items.length === 0) {
            return "No options available"; // Fallback text if array is empty
        }

        let previouslyDisplayed = JSON.parse(localStorage.getItem('displayedMenus')) || {};
        previouslyDisplayed[mealTypeKey] = previouslyDisplayed[mealTypeKey] || [];

        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        let validCandidates = items.filter(item => {
            const lastDisplayed = previouslyDisplayed[mealTypeKey].find(entry => entry.item === item);
            return !lastDisplayed || lastDisplayed.timestamp < oneWeekAgo;
        });

        let selectedItem;

        if (validCandidates.length > 0) {
            selectedItem = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        } else {
            console.warn(`All ${mealTypeKey} items displayed recently. Resetting history for ${mealTypeKey}.`);
            previouslyDisplayed[mealTypeKey] = []; // Clear history for this meal type
            selectedItem = items[Math.floor(Math.random() * items.length)]; // Pick from all original items
        }

        // Update previously displayed items in localStorage: keep only recent, add new
        previouslyDisplayed[mealTypeKey] = previouslyDisplayed[mealTypeKey].filter(entry => entry.timestamp >= oneWeekAgo);
        previouslyDisplayed[mealTypeKey].push({ item: selectedItem, timestamp: Date.now() });
        localStorage.setItem('displayedMenus', JSON.stringify(previouslyDisplayed));

        return selectedItem;
    }

    /**
     * Generates a menu item for a specific meal, updates the UI, updates currentDailyMenu,
     * and displays prompts if the options list is short.
     * @param {string} mealType - The meal type ('breakfast', 'lunch', 'dinner', 'snack', 'dessert').
     * @param {HTMLElement} itemTextElement - The HTML element where the item text is displayed.
     * @param {string} [sourceType=mealType] - The key for the menuData list (e.g., 'easyBreakfast').
     * @param {HTMLElement} [buttonToHide=null] - Optional button to hide after item is generated.
     */
    function generateAndDisplayMeal(mealType, itemTextElement, sourceType = mealType, buttonToHide = null) {
        const items = menuData[sourceType];

        if (!items || items.length === 0) {
            itemTextElement.textContent = `No ${sourceType} items available.`;
            currentDailyMenu[mealType] = null; // Mark as no item chosen
        } else {
            const item = getRandomMenuItem(items, sourceType);
            itemTextElement.textContent = item;
            currentDailyMenu[mealType] = item; // Store the chosen item in our daily menu object
        }

        // Remove any existing prompt before adding a new one
        const parentSection = itemTextElement.closest('.menu-section');
        const existingPrompt = parentSection ? parentSection.querySelector('.prompt') : null;
        if (existingPrompt) {
            existingPrompt.remove();
        }

        // Display a prompt if less than 7 options are available for the *sourceType*
        if (items && items.length < 7) {
            const promptDiv = document.createElement('div');
            promptDiv.classList.add('prompt');
            promptDiv.textContent = `Please add more ${sourceType} items to your list! (Currently ${items.length} options)`;
            if (parentSection) { // Ensure parentSection exists before appending
                parentSection.appendChild(promptDiv);
            }
        }

        // Hide the button if provided and update currentDailyMenu state flag
        if (buttonToHide) {
            buttonToHide.style.display = 'none';
            if (mealType === 'breakfast') currentDailyMenu.breakfastEasyUsed = true;
            if (mealType === 'lunch') currentDailyMenu.lunchEasyUsed = true;
            if (mealType === 'dinner') currentDailyMenu.dinnerEasyUsed = true;
        }

        // Special handling for snack/dessert visibility and their flags
        if (mealType === 'snack' && snackSectionWrapper) {
            snackSectionWrapper.style.display = 'block';
            currentDailyMenu.snackShown = true;
            if (showSnackBtn) showSnackBtn.style.display = 'none'; // Ensure optional button hides
        }
        if (mealType === 'dessert' && dessertSectionWrapper) {
            dessertSectionWrapper.style.display = 'block';
            currentDailyMenu.dessertShown = true;
            if (showDessertBtn) showDessertBtn.style.display = 'none'; // Ensure optional button hides
        }

        saveDailyMenuToLocalStorage(); // Save all changes to localStorage
    }

    /**
     * Updates the UI based on the items and flags stored in currentDailyMenu.
     * Used on initial load to restore the state.
     */
    function updateUIFromStoredMenu() {
        // Main meals
        if (currentDailyMenu.breakfast) {
            breakfastItemTextElement.textContent = currentDailyMenu.breakfast;
            if (currentDailyMenu.breakfastEasyUsed && easyBreakfastBtn) {
                easyBreakfastBtn.style.display = 'none';
            }
        }
        if (currentDailyMenu.lunch) {
            lunchItemTextElement.textContent = currentDailyMenu.lunch;
            if (currentDailyMenu.lunchEasyUsed && easyLunchBtn) {
                easyLunchBtn.style.display = 'none';
            }
        }
        if (currentDailyMenu.dinner) {
            dinnerItemTextElement.textContent = currentDailyMenu.dinner;
            if (currentDailyMenu.dinnerEasyUsed && easyDinnerBtn) {
                easyDinnerBtn.style.display = 'none';
            }
        }

        // Optional meals (Snack & Dessert)
        if (currentDailyMenu.snackShown) {
            snackItemElement.textContent = currentDailyMenu.snack || "No snack chosen."; // Display stored snack or a message
            if (snackSectionWrapper) snackSectionWrapper.style.display = 'block';
            if (showSnackBtn) showSnackBtn.style.display = 'none';
        }
        if (currentDailyMenu.dessertShown) {
            dessertItemElement.textContent = currentDailyMenu.dessert || "No dessert chosen."; // Display stored dessert or a message
            if (dessertSectionWrapper) dessertSectionWrapper.style.display = 'block';
            if (showDessertBtn) showDessertBtn.style.display = 'none';
        }
    }


    // --- Initial Load Logic ---

    // Get today's date for comparison
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayDateString = today.toLocaleDateString('en-US', options);

    // Display current date immediately
    dateDayElement.textContent = todayDateString;

    const loadedMenu = loadDailyMenuFromLocalStorage();

    if (loadedMenu && loadedMenu.date === todayDateString) {
        // If a menu exists for today, load it
        currentDailyMenu = { ...currentDailyMenu, ...loadedMenu }; // Merge to ensure all flags are present
        updateUIFromStoredMenu();
        console.log("Loaded menu for today:", currentDailyMenu); // Use console.log for debugging on desktop
    } else {
        // If it's a new day or no menu found, generate a fresh one
        console.log("New day or no menu found. Generating new menu."); // Use console.log
        currentDailyMenu.date = todayDateString;
        // Reset all flags for a new day
        currentDailyMenu.breakfastEasyUsed = false;
        currentDailyMenu.lunchEasyUsed = false;
        currentDailyMenu.dinnerEasyUsed = false;
        currentDailyMenu.snackShown = false;
        currentDailyMenu.dessertShown = false;

        // Generate initial main meals
        generateAndDisplayMeal('breakfast', breakfastItemTextElement);
        generateAndDisplayMeal('lunch', lunchItemTextElement);
        generateAndDisplayMeal('dinner', dinnerItemTextElement);
        // Snack and dessert are null by default and sections hidden, will be generated by buttons
    }


    // --- Event Listeners for Buttons ---

    // Easy Option Buttons
    if (easyBreakfastBtn) {
        easyBreakfastBtn.addEventListener('click', () => {
            generateAndDisplayMeal('breakfast', breakfastItemTextElement, 'easyBreakfast', easyBreakfastBtn);
        });
    }

    if (easyLunchBtn) {
        easyLunchBtn.addEventListener('click', () => {
            generateAndDisplayMeal('lunch', lunchItemTextElement, 'easyLunch', easyLunchBtn);
        });
    }

    if (easyDinnerBtn) {
        easyDinnerBtn.addEventListener('click', () => {
            generateAndDisplayMeal('dinner', dinnerItemTextElement, 'easyDinner', easyDinnerBtn);
        });
    }


    // Show Optional Buttons (Snack and Dessert)
    if (showSnackBtn) {
        showSnackBtn.addEventListener('click', () => {
            // generateAndDisplayMeal now handles showing the section and hiding the button itself
            generateAndDisplayMeal('snack', snackItemElement, 'snack', showSnackBtn);
        });
    }

    if (showDessertBtn) {
        showDessertBtn.addEventListener('click', () => {
            // generateAndDisplayMeal now handles showing the section and hiding the button itself
            generateAndDisplayMeal('dessert', dessertItemElement, 'dessert', showDessertBtn);
        });
    }
});
