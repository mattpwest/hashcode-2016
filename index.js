var fs = require('fs');
var path = require('path');

console.log('#HashCode2016');

var filename = process.argv[2];
var filenameIn = path.join('data', filename + '.in');
var filenameOut = path.join('data', filename + '.out');

// Read input
var content = fs.readFileSync(filenameIn, 'utf-8');
var contentLines = inputToLines(content);
//console.log(contentLines[0]);

// Parse input
var lineNo = 0;
var line = lineToItems(contentLines[lineNo++]);

//// Basic map information
var rows = parseInt(line[0]);
var cols = parseInt(line[1]);
var droneCount = parseInt(line[2]);
var deadline = parseInt(line[3]);
var maxLoad = parseInt(line[4]);
//console.log(rows, cols, drones, deadline, maxLoad);

//// Drones
var drones = [];

for (var i = 0; i < numProducts; i++) {
	var drone = {
		timeBusy: 0,
		product: -1,
		productCount: 0
	};
}

//// Weights
var numProducts = parseInt(contentLines[lineNo++]);

line = lineToItems(contentLines[lineNo++]);
var productWeights = [];
for (i = 0; i < numProducts; i++) {
	productWeights[i] = parseInt(line[i]);
}

//console.log(productWeights);

//// Warehouses
var numWarehouses = parseInt(contentLines[lineNo++]);
var warehouses = [];

for (i = 0; i < numWarehouses; i++) {
	line = lineToItems(contentLines[lineNo++]);
	var warehouse = {
		x: parseInt(line[0]),
		y: parseInt(line[1]),
		products: []
	};

	line = lineToItems(contentLines[lineNo++]);
	for (var j = 0; j < line.length; j++) {
		warehouse.products[j] = parseInt(line[j]);
	}

	warehouses[i] = warehouse;
}

//console.log(warehouses[0]);
//console.log(warehouses[warehouses.length - 1]);

//// Orders
var numOrders = parseInt(contentLines[lineNo++]);
var orders = [];

for (i = 0; i < numOrders; i++) {
	line = lineToItems(contentLines[lineNo++]);
	var order = {
		x: parseInt(line[0]),
		y: parseInt(line[1]),
		products: []
	};

	lineNo++; // Skip the number of items line
	line = lineToItems(contentLines[lineNo++]);
	for (var j = 0; j < line.length; j++) {
		order.products[j] = parseInt(line[j]);
	}

	orders[i] = order;
}

console.log(orders[0]);
console.log(orders[orders.length - 1]);

// Process
var commands = [];
var commandCount = 0;


//// Sort orders descending by number of items required
var prioritizedOrders = orders.sort(compareOrderByProductCountAsc);


var turn = 0;
/*while (turn < deadline) {


	turn++;
}*/





// Write output
var outputContent = commands.length + '\n';
for (i = 0; i < commands.length; i++) {
	outputContent += commands[i] + '\n';
}
fs.writeFileSync(filenameOut, outputContent);






function inputToLines(content) {
	var result = [];
	var line = 0;
	var i = 0;
	while (i < content.length) {
	    var j = content.indexOf('\n', i);
	    if (j == -1) {
	    	j = content.length;
	    }

	    result[line++] = content.substr(i, j - i);
	    i = j+1;
	}

	return result;
}

function lineToItems(line) {
	return line.split(' ');
}

function cmdLoad(droneId, warehouseId, productType, productCount) {
	commands[commandCount++] = droneId + ' ' +'L' + ' ' + warehouseId + ' ' + productType + ' ' + productCount;
}

function cmdUnload(droneId, warehouseId, productType, productCount) {
	commands[commandCount++] = droneId + ' ' +'U' + ' ' + warehouseId + ' ' + productType + ' ' + productCount;
}

function cmdDeliver(droneId, customerId, productType, productCount) {
	commands[commandCount++] = droneId + ' ' +'D' + ' ' + customerId + ' ' + productType + ' ' + productCount;
}

function cmdWait(droneId, turns) {
	commands[commandCount++] = droneId + ' ' + 'W' + ' ' + turns;
}

function compareOrderByProductCountAsc(orderA, orderB) {
	return orderA.products.length - orderB.products.length;
}