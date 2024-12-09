document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default form submission
            const bookmarkId = this.dataset.bookmarkId; // Get bookmark ID from data attribute
            document.getElementById('bookmarkId').value = bookmarkId; // Set in hidden form

            // Show the confirmation modal
            const modal = document.getElementById('confirmModal');
            modal.style.display = 'flex';

            // Handle confirmation buttons
            document.getElementById('confirmYes').onclick = function () {
                modal.style.display = 'none';
                document.getElementById('removeForm').submit(); // Submit the hidden form
            };

            document.getElementById('confirmNo').onclick = function () {
                modal.style.display = 'none'; // Close the modal without submitting
            };
        });
    });
});
