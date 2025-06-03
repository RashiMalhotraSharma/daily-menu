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

    // --- Global variable to hold the current day's menu ---
    // This will be loaded from localStorage or freshly generated
    let currentDailyMenu = {
        date: null,
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null, // Will be set if snack is chosen
        dessert: null // Will be set if dessert is chosen
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
                return JSON.parse(storedData);
            }
        } catch (e) {
            console.error("Failed to load menu from localStorage:", e);
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
        const existingPrompt = parentSection.querySelector('.prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }

        // Display a prompt if less than 7 options are available for the *sourceType*
        if (items && items.length < 7) {
            const promptDiv = document.createElement('div');
            promptDiv.classList.add('prompt');
            promptDiv.textContent = `Please add more ${sourceType} items to your list! (Currently ${items.length} options)`;
            parentSection.appendChild(promptDiv);
        }

        // Hide the button if provided
        if (buttonToHide) {
            buttonToHide.style.display = 'none';
        }

        saveDailyMenuToLocalStorage(); // Save changes to localStorage
    }

    /**
     * Updates the UI based on the items stored in currentDailyMenu.
     * Used on initial load to restore the state.
     */
    function updateUIFromStoredMenu() {
        // Main meals
        if (currentDailyMenu.breakfast) {
            breakfastItemTextElement.textContent = currentDailyMenu.breakfast;
            // Hide the easy button if a specific easy option was initially loaded
            if (currentDailyMenu.breakfast === menuData.easyBreakfast[0] || currentDailyMenu.breakfast === menuData.easyBreakfast[1] || currentDailyMenu.breakfast === menuData.easyBreakfast[2] || currentDailyMenu.breakfast === menuData.easyBreakfast[3]) { // Simple check, could be improved
                easyBreakfastBtn.style.display = 'none';
            }
        }
        if (currentDailyMenu.lunch) {
            lunchItemTextElement.textContent = currentDailyMenu.lunch;
            if (currentDailyMenu.lunch === menuData.easyLunch[0] || currentDailyMenu.lunch === menuData.easyLunch[1] || currentDailyMenu.lunch === menuData.easyLunch[2] || currentDailyMenu.lunch === menuData.easyLunch[3]) {
                easyLunchBtn.style.display = 'none';
            }
        }
        if (currentDailyMenu.dinner) {
            dinnerItemTextElement.textContent = currentDailyMenu.dinner;
            if (currentDailyMenu.dinner === menuData.easyDinner[0] || currentDailyMenu.dinner === menuData.easyDinner[1] || currentDailyMenu.dinner === menuData.easyDinner[2] || currentDailyMenu.dinner === menuData.easyDinner[3]) {
                easyDinnerBtn.style.display = 'none';
            }
        }

        // Optional meals (Snack & Dessert)
        if (currentDailyMenu.snack) {
            snackItemElement.textContent = currentDailyMenu.snack;
            snackSectionWrapper.style.display = 'block';
            showSnackBtn.style.display = 'none';
        }
        if (currentDailyMenu.dessert) {
            dessertItemElement.textContent = currentDailyMenu.dessert;
            dessertSectionWrapper.style.display = 'block';
            showDessertBtn.style.display = 'none';
        }
    }


    // --- Initial Load Logic ---

    // Get today's date string for comparison (e.g., "Tuesday, June 3, 2025")
    const todayDateString = today.toLocaleDateString('en-US', options);
    dateDayElement.textContent = todayDateString; // Always display current date

    const loadedMenu = loadDailyMenuFromLocalStorage();

    if (loadedMenu && loadedMenu.date === todayDateString) {
        // If a menu exists for today, load it
        currentDailyMenu = loadedMenu;
        updateUIFromStoredMenu();
        console.log("Loaded menu for today:", currentDailyMenu);
    } else {
        // If it's a new day or no menu found, generate a fresh one
        console.log("Generating new menu for today.");
        currentDailyMenu.date = todayDateString;
        generateAndDisplayMeal('breakfast', breakfastItemTextElement);
        generateAndDisplayMeal('lunch', lunchItemTextElement);
        generateAndDisplayMeal('dinner', dinnerItemTextElement);
        // Snack and dessert are null by default, will be generated by buttons
    }


    // --- Event Listeners for Buttons ---

    // Easy Option Buttons
    easyBreakfastBtn.addEventListener('click', () => {
        generateAndDisplayMeal('breakfast', breakfastItemTextElement, 'easyBreakfast', easyBreakfastBtn);
    });

    easyLunchBtn.addEventListener('click', () => {
        generateAndDisplayMeal('lunch', lunchItemTextElement, 'easyLunch', easyLunchBtn);
    });

    easyDinnerBtn.addEventListener('click', () => {
        generateAndDisplayMeal('dinner', dinnerItemTextElement, 'easyDinner', easyDinnerBtn);
    });


    // Show Optional Buttons (Snack and Dessert)
    showSnackBtn.addEventListener('click', () => {
        // First, make the section visible
        snackSectionWrapper.style.display = 'block';
        // Then generate and display the meal, updating the stored menu and hiding button
        generateAndDisplayMeal('snack', snackItemElement, 'snack', showSnackBtn);
    });

    showDessertBtn.addEventListener('click', () => {
        // First, make the section visible
        dessertSectionWrapper.style.display = 'block';
        // Then generate and display the meal, updating the stored menu and hiding button
        generateAndDisplayMeal('dessert', dessertItemElement, 'dessert', showDessertBtn);
    });
});
