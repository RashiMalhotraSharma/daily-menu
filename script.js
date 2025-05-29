// Make sure to include menuData.js *before* script.js in your HTML:
// <script src="menuData.js"></script>
// <script src="script.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const dateDayElement = document.getElementById('date-day');
    // Adjusted to get the specific <span> element for the item text
    const breakfastItemTextElement = document.getElementById('breakfast-text');
    const lunchItemTextElement = document.getElementById('lunch-text');
    const dinnerItemTextElement = document.getElementById('dinner-text');

    const snackItemElement = document.getElementById('snack-item');
    const dessertItemElement = document.getElementById('dessert-item');

    const snackSectionWrapper = document.getElementById('snack-section-wrapper');
    const dessertSectionWrapper = document.getElementById('dessert-section-wrapper');

    const showSnackBtn = document.getElementById('show-snack-btn');
    const showDessertBtn = document.getElementById('show-dessert-btn');

    // References to the easy option buttons
    const easyBreakfastBtn = document.getElementById('easy-breakfast-btn');
    const easyLunchBtn = document.getElementById('easy-lunch-btn');
    const easyDinnerBtn = document.getElementById('easy-dinner-btn');


    // --- Display Date and Day ---
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDayElement.textContent = today.toLocaleDateString('en-US', options);

    // --- Menu Logic ---

    /**
     * Gets a random menu item from a list, ensuring it hasn't been displayed in the last week.
     * @param {Array<string>} items - The array of menu items to choose from.
     * @param {string} mealType - The type of meal (e.g., 'breakfast', 'easyBreakfast') for localStorage tracking.
     * @returns {string} The randomly selected menu item.
     */
    function getRandomMenuItem(items, mealType) {
        let previouslyDisplayed = JSON.parse(localStorage.getItem('displayedMenus')) || {};
        previouslyDisplayed[mealType] = previouslyDisplayed[mealType] || [];

        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        let validCandidates = items.filter(item => {
            const lastDisplayed = previouslyDisplayed[mealType].find(entry => entry.item === item);
            return !lastDisplayed || lastDisplayed.timestamp < oneWeekAgo;
        });

        let selectedItem;

        if (validCandidates.length > 0) {
            selectedItem = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        } else {
            console.warn(`All ${mealType} items displayed recently. Resetting history for ${mealType}.`);
            previouslyDisplayed[mealType] = [];
            selectedItem = items[Math.floor(Math.random() * items.length)];
        }

        previouslyDisplayed[mealType] = previouslyDisplayed[mealType].filter(entry => entry.timestamp >= oneWeekAgo);
        previouslyDisplayed[mealType].push({ item: selectedItem, timestamp: Date.now() });
        localStorage.setItem('displayedMenus', JSON.stringify(previouslyDisplayed));

        return selectedItem;
    }

    /**
     * Displays a menu item for a given meal type and shows a prompt if options are limited.
     * @param {string} mealType - The type of meal (e.g., 'breakfast').
     * @param {HTMLElement} element - The HTML element where the item name should be displayed (now typically a <span>).
     * @param {string} [sourceType=mealType] - Optional: The specific source list to use (e.g., 'easyBreakfast').
     */
    function displayMenuAndCheckCount(mealType, element, sourceType = mealType) {
        const items = menuData[sourceType];

        if (!items || items.length === 0) {
            element.textContent = `No ${sourceType} items available.`;
            return;
        }

        const item = getRandomMenuItem(items, sourceType);
        element.textContent = item; // Update the text content of the span

        // Remove any existing prompt. The prompt is sibling to the .menu-item div
        const parentSection = element.closest('.menu-section'); // Find the closest parent .menu-section
        const existingPrompt = parentSection.querySelector('.prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }

        // Display a prompt if less than 7 options are available
        if (items.length < 7) {
            const promptDiv = document.createElement('div');
            promptDiv.classList.add('prompt');
            promptDiv.textContent = `Please add more ${sourceType} items to your list! (Currently ${items.length} options)`;
            // Append the prompt to the parent section, after the menu-item div
            parentSection.appendChild(promptDiv);
        }
    }

    // --- Initial Load: Display only Breakfast, Lunch, Dinner ---
    // Ensure we pass the correct text element for each meal
    displayMenuAndCheckCount('breakfast', breakfastItemTextElement);
    displayMenuAndCheckCount('lunch', lunchItemTextElement);
    displayMenuAndCheckCount('dinner', dinnerItemTextElement);


    // --- Event Listeners for "Easy Option" Buttons ---

    easyBreakfastBtn.addEventListener('click', () => {
        displayMenuAndCheckCount('breakfast', breakfastItemTextElement, 'easyBreakfast');
        easyBreakfastBtn.style.display = 'none'; // Hide the button after use
    });

    easyLunchBtn.addEventListener('click', () => {
        displayMenuAndCheckCount('lunch', lunchItemTextElement, 'easyLunch');
        easyLunchBtn.style.display = 'none'; // Hide the button after use
    });

    easyDinnerBtn.addEventListener('click', () => {
        displayMenuAndCheckCount('dinner', dinnerItemTextElement, 'easyDinner');
        easyDinnerBtn.style.display = 'none'; // Hide the button after use
    });


    // --- Event Listeners for "Show Optional" Buttons (Snack and Dessert) ---

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
            itemElement.textContent = `No ${mealType} items available.`;
            sectionWrapper.style.display = 'block';
            buttonElement.style.display = 'none';
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
