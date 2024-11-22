if (!window.hasBeforeUnloadListener) {
    window.hasBeforeUnloadListener = true;
    window.addEventListener('beforeunload', function (e) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to close?';
        return e.returnValue;
    }, true);
}