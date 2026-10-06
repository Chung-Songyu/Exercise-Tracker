// Clear and hide all error messages
const clearErrorMsg = function () {
    document.querySelectorAll(".error").forEach(el => {
        el.hidden = true;
        el.innerText = "";
    });
    console.log("clearErrorMsg()");
}
clearErrorMsg();

// Add user
const addUser = document.getElementById("user-form");
addUser.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrorMsg();

    const username = addUser.elements["username"].value;
    console.log("Add user: " + username);
    
    let bValidationError = false;
    // Form Validation - Username (Letters, Space, Apostrophe, Hyphen)
    const regexLetterSpace = /^[A-Za-z '-]+$/;
    if (!regexLetterSpace.test(username)) {
        document.getElementById("error-username").hidden = false;
        document.getElementById("error-username").innerText += "Invalid username.";
        bValidationError = true;
    }
    
    // Validation result
    if (bValidationError) {
        return;
    }
    
    // AJAX
    const data = new FormData(addUser);
    const jsonData = Object.fromEntries(data.entries());
    try {
        // Send JSON request to endpoint
        const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData)
        });
        
        const result = await response.json();
        console.log(result);
        
        // Success message
        document.getElementById("pageOverlay").style.display = "flex";
        document.getElementById("modalMessage").innerHTML =
            "<p><span id='copyUser'><b>" + result.username + "</b></span> created successfully.</p>" +
            "<p>User _id is <span id='copyID'><b>" + result._id + "</b></span>. (<span id='copyPrompt'>Copy</span>)</p>" +
            "<p>Please copy down the _id as it is needed to add a new exercise or view the exercise log.</p>";

        // Copy to clipboard
        const copyID = document.getElementById("copyID");
        const copyPrompt = document.getElementById("copyPrompt");
        copyPrompt.addEventListener("click", event => {
            navigator.clipboard.writeText(copyID.innerText);
            document.getElementById("copyPrompt").innerText = "Copied!";
        })

        // Clear form field
        addUser.elements["username"].value = '';

    } catch (err) {
        console.log(err);

        // Error message
        document.getElementById("error-username").hidden = false;
        document.getElementById("error-username").innerText = err.error;
    }
});

// Close Success Message Modal
document.getElementById("modalOK").addEventListener("click", function () {
    document.getElementById("pageOverlay").style.display = "none";
});

// Set parameters for date field
const date = document.getElementById("date");
const today = new Date();

const minDate = new Date(today);
minDate.setFullYear(today.getFullYear() - 1);

const maxDate = new Date(today);
maxDate.setFullYear(today.getFullYear() + 1);

function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

date.value = formatDate(today);
date.min = formatDate(minDate);
date.max = formatDate(maxDate);

// Add exercise
const addExercise = document.getElementById("exercise-form");
addExercise.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrorMsg();

    const userId = document.getElementById("userId").value;
    const description = document.getElementById("description").value;
    const duration = document.getElementById("duration").value;
    const date = document.getElementById("date").value;
    
    let bValidationError = false;
    // Form Validation - _id (Alphanumeric, Length)
    const regexAlphanumericLength = /^[0-9a-fA-F]{24}$/;
    if (!regexAlphanumericLength.test(userId)) {
        document.getElementById("error-userid").hidden = false;
        document.getElementById("error-userid").innerText += "Invalid _id.";
        bValidationError = true;
    }

    // Form Validation - Description (No unusual characters)
    const regexNoUnusualChar = /^[A-Za-z0-9 .,!?'"()\-]+$/;
    if (!regexNoUnusualChar.test(description)) {
        document.getElementById("error-description").hidden = false;
        document.getElementById("error-description").innerText += "Invalid description.";
        bValidationError = true;
    }

    // Validation result
    if (bValidationError) {
        return;
    }

    addExercise.action = `/api/users/${userId}/exercises`;
    addExercise.submit();
});