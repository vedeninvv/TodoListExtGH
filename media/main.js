(function() {
    const vscode = acquireVsCodeApi();

    document.querySelector('input').addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
            // можете делать все что угодно со значением текстового поля
            vscode.postMessage({
                command: 'addTask',
                text: document.querySelector('input').value
            });
            document.querySelector('input').focus();
        }
    });

    document.getElementById("addButton").addEventListener("click", function(e) {
        vscode.postMessage({
            command: 'addTask',
            text: document.querySelector('input').value
        });
    });

    var elements = document.querySelectorAll('.mark') || [];
    elements = [].slice.apply(elements); // toArray
    elements.forEach(function(element, i) {
        element.addEventListener('click', function(e) {
            vscode.postMessage({
                command: 'deleteTask',
                text: (i + 1)
            });
        });
    });

})();