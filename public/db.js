let db;

const request = indexedDB.open('BudgetDB', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('BudgetStore', {autoIncrement: true});
}

request.onerror = function (e) {
    console.log(`Oh no! ${e.target.eerorCode}`)
};

function checkDatabase() {
    console.log('check db invoked');

    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    // access BudgetStore object
    const store = transaction.objectStore('BudgetStore');
  
    // Get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        // If there are items in the store, we need to bulk add them when we are back online
        if (getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
            },
          })
            .then((response) => response.json())
            .then((res) => {
              // If our returned response is not empty
              if (res.length !== 0) {
                // Open another transaction to BudgetStore with the ability to read and write
                transaction = db.transaction(['BudgetStore'], 'readwrite');
    
                // Assign the current store to a variable
                const currentStore = transaction.objectStore('BudgetStore');
    
                // Clear existing entries because our bulk add was successful
                currentStore.clear();
                console.log('Clearing store 🧹');
              }
            });
        }
    };
} 

request.onsuccess = function (event) {
    console.log('success');
    db = event.target.result;
  
    // Check if site is online before reading from db
    if (navigator.onLine) {
      console.log('Backend online! 🗄️');
      checkDatabase();
    }
  };
  
  const saveRecord = (record) => {
    console.log('Save record invoked');
    // Create a transaction on the BudgetStore db with readwrite access
    const transaction = db.transaction(['BudgetStore'], 'readwrite');
  
    // access budget store
    const store = transaction.objectStore('BudgetStore');
  
    // Add record to store with add method.
    store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);