document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const bookmarkId = this.dataset.bookmarkId;
            document.getElementById('bookmarkId').value = bookmarkId;

            const modal = document.getElementById('confirmModal');
            modal.style.display = 'flex';

            document.getElementById('confirmYes').onclick = function () {
                modal.style.display = 'none';
                document.getElementById('removeForm').submit();
            };

            document.getElementById('confirmNo').onclick = function () {
                modal.style.display = 'none';
            };
        });
    });
});