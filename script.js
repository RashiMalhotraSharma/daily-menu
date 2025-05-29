// Make sure to include menuData.js *before* script.js in your HTML:
// <script src="menuData.js"></script>
// <script src="script.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const dateDayElement = document.getElementById('date-day');
    const breakfastItemElement = document.getElementById('breakfast-item');
    const lunchItemElement = document.getElementById('lunch-item');
    const dinnerItemElement = document.getElementById('dinner-item');
    const snackItemElement = document.getElementById('snack-item');
    const dessertItemElement = document.getElementById('dessert-item');

    const snackSection = document.getElementById('snack-section');
    const dessertSection = document.getElementById('dessert-section');

    // --- Display Date and Day ---
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDayElement.textContent = today.toLocaleDateString('en-US', options);

    // --- Menu Logic ---

    // Function to get a random item from an array, avoiding recent repeats
    function getRandomMenuItem(items, mealType) {
        // Retrieve previously displayed items from localStorage (or initialize)
        let previouslyDisplayed = JSON.parse(localStorage.getItem('displayedMenus')) || {};
        previouslyDisplayed[mealType] = previouslyDisplayed[mealType] || [];

        // Filter out items that have been displayed in the last week
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
        const availableItems = items.filter(item => {
            const lastDisplayed = previouslyDisplayed[mealType].find(entry => entry.item === item);
            return !lastDisplayed || lastDisplayed.timestamp < oneWeekAgo;
        });

        let selectedItem;
        if (availableItems.length > 0) {
            selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        } else {
            // If all items have been displayed in the last week, clear history and pick randomly
            // This is a fallback to ensure something always displays
            console.warn(`All ${mealType} items displayed recently. Resetting history for ${mealType}.`);
            previouslyDisplayed[mealType] = [];
            selectedItem = items[Math.floor(Math.random() * items.length)];
        }

        // Update previously displayed items, keeping only the last 7 entries for each meal type
        previouslyDisplayed[mealType] = previouslyDisplayed[mealType].filter(entry => entry.timestamp >= oneWeekAgo);
        previouslyDisplayed[mealType].push({ item: selectedItem, timestamp: Date.now() });
        localStorage.setItem('displayedMenus', JSON.stringify(previouslyDisplayed));

        return selectedItem;
    }

    // Function to display menu item and check for count
    function displayMenuAndCheckCount(mealType, element) {
        const items = menuData[mealType];
        if (!items || items.length === 0) {
            element.textContent = `No ${mealType} items available.`;
            return;
        }

        const item = getRandomMenuItem(items, mealType);
        element.textContent = item;

        if (items.length < 7) {
            const promptDiv = document.createElement('div');
            promptDiv.classList.add('prompt');
            promptDiv.textContent = `Please add more ${mealType} items to your Excel file! (Currently ${items.length} options)`;
            element.parentNode.appendChild(promptDiv); // Add prompt below the item
        }
    }

    // Display fixed meals
    displayMenuAndCheckCount('breakfast', breakfastItemElement);
    displayMenuAndCheckCount('lunch', lunchItemElement);
    displayMenuAndCheckCount('dinner', dinnerItemElement);

    // Display optional meals if available
    if (menuData.snack && menuData.snack.length > 0) {
        displayMenuAndCheckCount('snack', snackItemElement);
    } else {
        snackSection.style.display = 'none'; // Hide snack section if no items
    }

    if (menuData.dessert && menuData.dessert.length > 0) {
        displayMenuAndCheckCount('dessert', dessertItemElement);
    } else {
        dessertSection.style.display = 'none'; // Hide dessert section if no items
    }
});
