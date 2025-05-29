// Make sure to include menuData.js *before* script.js in your HTML:
// <script src="menuData.js"></script>
// <script src="script.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const dateDayElement = document.getElementById('date-day');
    const breakfastItemElement = document.getElementById('breakfast-item');
    const lunchItemElement = document.getElementById('lunch-item');
    const dinnerItemElement = document.getElementById('dinner-item');

    const snackItemElement = document.getElementById('snack-item');
    const dessertItemElement = document.getElementById('dessert-item');

    const snackSectionWrapper = document.getElementById('snack-section-wrapper');
    const dessertSectionWrapper = document.getElementById('dessert-section-wrapper');

    const showSnackBtn = document.getElementById('show-snack-btn');
    const showDessertBtn = document.getElementById('show-dessert-btn');

    // --- Display Date and Day ---
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDayElement.textContent = today.toLocaleDateString('en-US', options);

    // --- Menu Logic (Without Combination Rules) ---

    /**
     * Gets a random menu item from a list, ensuring it hasn't been displayed in the last week.
     * @param {Array<string>} items - The array of menu items to choose from.
     * @param {string} mealType - The type of meal (e.g., 'breakfast', 'lunch') for localStorage tracking.
     * @returns {string} The randomly selected menu item.
     */
    function getRandomMenuItem(items, mealType) {
        // Retrieve previously displayed items from localStorage (or initialize if empty)
        let previouslyDisplayed = JSON.parse(localStorage.getItem('displayedMenus')) || {};
        previouslyDisplayed[mealType] = previouslyDisplayed[mealType] || [];

        // Calculate the timestamp for one week ago
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

        // Filter out items that have been displayed in the last week
        let validCandidates = items.filter(item => {
            const lastDisplayed = previouslyDisplayed[mealType].find(entry => entry.item === item);
            return !lastDisplayed || lastDisplayed.timestamp < oneWeekAgo;
        });

        let selectedItem;

        // If there are valid candidates (not displayed in the last week)
        if (validCandidates.length > 0) {
            selectedItem = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        } else {
            // Fallback: If all items have been displayed in the last week,
            // reset the history for this meal type and pick randomly from all items.
            console.warn(`All ${mealType} items displayed recently. Resetting history for ${mealType}.`);
            previouslyDisplayed[mealType] = [];
            selectedItem = items[Math.floor(Math.random() * items.length)]; // Pick from all original items
        }

        // Update previously displayed items in localStorage
        // Keep only entries from the last week
        previouslyDisplayed[mealType] = previouslyDisplayed[mealType].filter(entry => entry.timestamp >= oneWeekAgo);
        // Add the newly selected item with current timestamp
        previouslyDisplayed[mealType].push({ item: selectedItem, timestamp: Date.now() });
        // Save back to localStorage
        localStorage.setItem('displayedMenus', JSON.stringify(previouslyDisplayed));

        return selectedItem;
    }

    /**
     * Displays a menu item for a given meal type and shows a prompt if options are limited.
     * @param {string} mealType - The type of meal (e.g., 'breakfast').
     * @param {HTMLElement} element - The HTML element where the item name should be displayed.
     */
    function displayMenuAndCheckCount(mealType, element) {
        const items = menuData[mealType]; // Get items from menuData (defined in menuData.js)

        // Handle case where no items are available for this meal type
        if (!items || items.length === 0) {
            element.textContent = `No ${mealType} items available.`;
            return;
        }

        // Get a random item using the simplified logic
        const item = getRandomMenuItem(items, mealType);
        element.textContent = item;

        // Display a prompt if less than 7 options are available
        if (items.length < 7) {
            const promptDiv = document.createElement('div');
            promptDiv.classList.add('prompt');
            promptDiv.textContent = `Please add more ${mealType} items to your Menu! (Currently ${items.length} options)`;
            // Append the prompt below the menu item
            element.parentNode.appendChild(promptDiv);
        }
    }

    // --- Initial Load: Display only Breakfast, Lunch, Dinner ---
    // The order doesn't matter as much now since there are no combination checks
    displayMenuAndCheckCount('breakfast', breakfastItemElement);
    displayMenuAndCheckCount('lunch', lunchItemElement);
    displayMenuAndCheckCount('dinner', dinnerItemElement);

    // --- Button Event Listeners for Snack and Dessert ---

    /**
     * Handles the display of an optional meal section when its button is clicked.
     * @param {string} mealType - The type of meal (e.g., 'snack', 'dessert').
     * @param {HTMLElement} itemElement - The HTML element where the item name will be displayed.
     * @param {HTMLElement} sectionWrapper - The parent div wrapping the meal section.
     * @param {HTMLElement} buttonElement - The button that triggers showing this section.
     */
    function showOptionalMeal(mealType, itemElement, sectionWrapper, buttonElement) {
        if (menuData[mealType] && menuData[mealType].length > 0) {
            displayMenuAndCheckCount(mealType, itemElement); // Generate and display the item
            sectionWrapper.style.display = 'block'; // Make the section visible
            buttonElement.style.display = 'none'; // Hide the button after showing the section
        } else {
            // If no items are available, still show the section to display a message
            itemElement.textContent = `No ${mealType} items available.`;
            sectionWrapper.style.display = 'block';
            buttonElement.style.display = 'none'; // Hide the button anyway
        }
    }

    // Add event listener for the "Show Snack Option" button
    showSnackBtn.addEventListener('click', () => {
        showOptionalMeal('snack', snackItemElement, snackSectionWrapper, showSnackBtn);
    });

    // Add event listener for the "Show Dessert Option" button
    showDessertBtn.addEventListener('click', () => {
        showOptionalMeal('dessert', dessertItemElement, dessertSectionWrapper, showDessertBtn);
    });
});
