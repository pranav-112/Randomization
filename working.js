let data = [];
let headers = [];

// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fileInputFamily').addEventListener('change', handleFile, false);
    document.getElementById('fileInputVin').addEventListener('change', handleFile, false);
    toggleInputs(); // Show the correct input fields based on the selected table type
    document.getElementById('randomizeButton').addEventListener('click', randomizeRows);
    document.getElementById('downloadScreenshot').addEventListener('click', takeScreenshot);
});

// handle file input changes
function handleFile(e) {
    const file = e.target.files[0]; // Get the selected file
    if (!file) { // If no file is selected, alert the user
        alert('No file selected.');
        return;
    }

    const reader = new FileReader(); // Create a FileReader to read the file
    reader.onload = function(event) {
        try {
            const dataArray = new Uint8Array(event.target.result); // Convert the file data to a Uint8Array
            const workbook = XLSX.read(dataArray, { type: 'array' }); // Read the data as an Excel workbook
            const tableType = document.getElementById('tableType').value;

            let worksheet;
            let jsonData;
            if (tableType === 'vinDetails') {
                if (workbook.SheetNames.length > 1) { // Check if the second sheet exists
                    const secondSheetName = workbook.SheetNames[1];
                    worksheet = workbook.Sheets[secondSheetName];
                    jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    headers = jsonData[1]; // Store the headers
                    displayTable(jsonData.slice(2), false); // Display the second sheet, excluding the first row
                    console.log(jsonData);
                } else {
                    alert('The selected Excel file does not contain a second sheet for VIN details.');
                    return;
                }
            } else {
                const firstSheetName = workbook.SheetNames[0];
                worksheet = workbook.Sheets[firstSheetName];
                jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                headers = jsonData.slice(0, 3); // Store the headers and sub-headers
                const filledJsonData = fillEmptyCells(jsonData);
                displayTable(filledJsonData.slice(3), true); // Exclude the first three rows for family table
            }

            adjustContainerSize(); // Adjust the form container size
        } catch (error) {
            alert('Error reading file. Please ensure it is a valid Excel file.'); // Alert the user if there's an error reading the file
        }
    };
    reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
}

//fill empty cells and handle merged cells
function fillEmptyCells(jsonData) {
    for (let rowIndex = 3; rowIndex < jsonData.length; rowIndex++) { // Start from the fourth row
        for (let colIndex = 0; colIndex < jsonData[rowIndex].length; colIndex++) {
            if (jsonData[rowIndex][colIndex] === undefined || jsonData[rowIndex][colIndex] === null || jsonData[rowIndex][colIndex] === '') {
                jsonData[rowIndex][colIndex] = jsonData[rowIndex - 1][colIndex] || 'N/A';
            }
        }
    }
    return jsonData;    
}

// //Function to display the data in a table
function displayTable(jsonData, fillForward) {
    const container = document.getElementById('table-container'); // Get the table container element
    container.innerHTML = ''; // Clear any existing content
    const table = document.createElement('table'); // Create a new table element
    if(document.getElementById("apexNumber").value.length==0){
        alert("Please Enter Apex number.");
        return;
    }
    // Append title row if fillForward is true
    if (fillForward) {
        const titleRow = document.createElement('tr');
        const titleCell = document.createElement('td');
        titleCell.colSpan = headers[1].length;
        titleCell.textContent = headers[0];
        titleRow.appendChild(titleCell);
        table.appendChild(titleRow);
        // Append header row
        const headerRow = document.createElement('tr');
        headers[1].forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header;

            // Set colSpan or rowSpan based on the header content
            if (header === 'CMVR Type Approval Certificate Details' || header === 'Tentative Production Plan / Actual Production for CSFC COP Period') {
                th.colSpan = 2;
            } else {
                th.rowSpan = fillForward ? 2 : 1; // Other headers span two rows if fillForward is true
            }

            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
    }
    else{
        // Append header row
        const headerRow = document.createElement('tr');
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header;

            // Set colSpan or rowSpan based on the header content
            if (header === 'Certificate Details' || header === 'Tentative Production Plan / Actual Production for CSFC COP Period') {
                th.colSpan = 2;
            } else {
                th.rowSpan = fillForward ? 2 : 1; // Other headers span two rows if fillForward is true
            }

            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
    }
    // Append sub-header row if fillForward is true
    if (fillForward && headers[1] && Array.isArray(headers[1])) {
        const subHeaderRow = document.createElement('tr');
        headers[2].forEach(subHeader => {
            const th = document.createElement('th');
            th.textContent = subHeader;
            subHeaderRow.appendChild(th);
        });
        table.appendChild(subHeaderRow);
    }

    // Create and append data rows, starting from the correct index
    const startIndex = fillForward ? 1 : 0;
    for (let i = startIndex; i < jsonData.length; i++) {
        const row = jsonData[i];
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    }

    container.appendChild(table); // Add the table to the container
    data = jsonData; // Store the data excluding the non-randomizable rows  
}

function randomizeRows(event) {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page
    if(document.getElementById("apexNumber").value.length==0){
        alert("Please Enter Apex number.");
        return;
    }
    if (data.length === 0) { // Check if there is data to randomize
        alert('No data available for randomization.');
        return;
    }

    const tableType = document.getElementById('tableType').value; // Get the selected table type
    if (tableType === 'familyTable') {
        // For familyTable, select one random row
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomRow = data[randomIndex];

        // Check if there are multiple plants in the "Plants" cell (index 6)
        let plantsCell = randomRow[6];
        if (plantsCell.includes(',')) {
            let plants = plantsCell.split(',').map(plant => plant.trim());
            let randomPlant = plants[Math.floor(Math.random() * plants.length)];
            randomRow[6] = randomPlant; // Update the cell with the randomly selected plant
        }

        displayRandomRows([randomRow], tableType); // Display the randomly selected row
    } else {
        // For vinDetails, get the number of selections
        let numSelections = parseInt(document.getElementById('numSelections').value);
        if (isNaN(numSelections) || numSelections < 1 || numSelections > 20) { // Validate the number of selections
            alert("Please enter a valid number between 1 and 20.");
            return;
        }

        if (numSelections > data.length) {
            alert("The number of selections is greater than the available rows.");
            return;
        }

        const randomRows = []; // Initialize an array to hold the random rows
        const dataCopy = [...data]; // Create a copy of the data

        // Select random rows from the data
        for (let i = 0; i < numSelections; i++) {
            const randomIndex = Math.floor(Math.random() * dataCopy.length);
            randomRows.push(dataCopy[randomIndex]);
            dataCopy.splice(randomIndex, 1);
        }
        displayRandomRows(randomRows, tableType); // Display the randomly selected rows
    }
}

// Function to display the randomly selected rows
function displayRandomRows(rows, tableType) {
    const container = document.getElementById('random-row-container'); // Get the container for the random rows
    container.innerHTML = '<h3>Below Row is selected after the randomization for CSFC-CoP testing: </h3>'; // Set the container title

    const table = document.createElement('table'); // Create a new table element
    const headerRow = document.createElement('tr'); // Create a row for the headers

    // Create and append header cells
    if (tableType === 'familyTable'){
        const headers = ['Serial Number', 'Model Name', 'Plants', 'Certificate Number', 'Certificate Date'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
    } else {
        headers.forEach(header => {
            const th = document.createElement('th');    
            th.textContent = header;
            headerRow.appendChild(th);
        });
    }
    table.appendChild(headerRow);

    // Create and append data rows
    rows.forEach(row => {
        const tr = document.createElement('tr');
        if (tableType === 'familyTable') {
            const columnsToDisplay = [0, 4, 6, 7, 8]; // Indexes of the columns to display
            columnsToDisplay.forEach(index => {
                const td = document.createElement('td');
                td.textContent = row[index];
                tr.appendChild(td);
            });
        } else {
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
        }
        table.appendChild(tr);
    });

    container.appendChild(table); // Add the table to the container
    document.getElementById('table-container').innerHTML = ''; // Clear the original table
}

// Function to adjust the form container size
function adjustContainerSize() {
    const formContainer = document.getElementById('formContainer');
    formContainer.style.maxHeight = 'none';
    formContainer.style.height = 'auto';
    formContainer.style.maxWidth = 'none';
    formContainer.style.width = 'auto';
}

// Function to take a screenshot of the page
function takeScreenshot() {
    html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL();
        link.download = 'Randomization.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Function to refresh the page
function refreshPage() {
    location.reload();
}

// Function to toggle input fields based on the selected table type
function toggleInputs() {
    const tableType = document.getElementById('tableType').value; // Get the selected table type
    const familyTableInputs = document.getElementById('familyTableInputs'); // Get the Family Table input container
    const vinDetailsInputs = document.getElementById('vinDetailsInputs'); // Get the VIN Details input container

    // Show or hide input fields based on the selected table type
    if (tableType === 'familyTable') {
        familyTableInputs.style.display = 'block';
        vinDetailsInputs.style.display = 'none';
    } else {
        familyTableInputs.style.display = 'none';
        vinDetailsInputs.style.display = 'block';
    }
}