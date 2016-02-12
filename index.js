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

for (var i = 0; i < droneCount; i++) {
	var drone = {
		x: 0,
		y: 0,
		mode: 'idle',
		timeBusy: 0,
		product: -1,
		productCount: 0,
		targets: []
	};

	drones[i] = drone;
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
		id: i,
		x: parseInt(line[0]),
		y: parseInt(line[1]),
		productsWanted: [],
		productsEnRoute: [],
		productsDelivered: []
	};

	lineNo++; // Skip the number of items line
	line = lineToItems(contentLines[lineNo++]);
	for (var j = 0; j < line.length; j++) {
		order.productsWanted[j] = parseInt(line[j]);
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
while (turn < deadline) {

	if (turn % 1000 === 0) {
		console.log('Turn: ', turn);
	}

	for (i = 0; i < droneCount; i++) {
		drone = drones[i];

		updateDrone(i);

		//console.log('droneId: ', i);

		if (drone.mode === 'idle' && drone.targets.length === 0) {
			// Find the first needed product...
			var nextProduct = -1;
			var orderIt = 0;
			loop1:
			while (nextProduct < 0 && orderIt < prioritizedOrders.length) {
				order = prioritizedOrders[orderIt++];
				if (order.productsWanted.length > 0) {
					nextProduct = order.productsWanted[0];
					break loop1;
				}
			}

			console.log('\ttarget product: ', nextProduct);

			// How many can we carry...
			var canCarry = Math.floor(maxLoad / productWeights[nextProduct]);

			console.log('\tcanCarry: ', canCarry);

			// Where can we find max(maxCarry, available)...
			var targetWarehouse = -1;
			var maxFound = 0;
			for (j = 0; j < warehouses.length; j++) {
				warehouse = warehouses[j];

				if (warehouse.products[nextProduct] > maxFound) {
					maxFound = warehouse.products[nextProduct];
					targetWarehouse = j;
				}
			}

			var toLoad = Math.min(maxFound, canCarry);
			console.log('\ttargetWarehouse: ', targetWarehouse);
			console.log('\tnumberToLoad: ', toLoad);

			// Issue load command to that warehouse, reduce number of that item at the warehouse...
			console.log('\ttargetWarehouse.productBefore: ', warehouses[targetWarehouse].products[nextProduct]);
			if (targetWarehouse >= 0 && toLoad > 0) {
				console.log('\t\tLOAD');
				cmdLoad(i, targetWarehouse, nextProduct, toLoad);
			}
			console.log('\ttargetWarehouse.productAfter: ',  warehouses[targetWarehouse].products[nextProduct]);

			// Find first N customers that need that item and set them as the drone targets
			var targets = [];
			var available = drone.productCount;
			orderIt--;
			while (available > 0 && orderIt < prioritizedOrders.length) {
				order = prioritizedOrders[orderIt++];

				var found = false;
				for (var j = 0; j < order.productsWanted.length; j++) {
					if (order.productsWanted[j] === nextProduct) {
						available--;

						order.productsWanted.splice(order.productsWanted.indexOf(nextProduct), 1);
						order.productsEnRoute.push(nextProduct);

						found = true;
					}
				}

				if (found) {
					targets.push(order.id);
				}
			}

			drone.targets = targets;
		} else if (drone.mode === 'idle' && drone.targets.length > 0) {
			var order = orders[drone.targets[0]];
			var count = 0;
			for (j = 0; j < order.productsEnRoute.length; j++) {
				console.log('DroneId: ', i);
				console.log('DroneProduct: ', drone.product);
				console.log('ProductsEnRoute: ', order.productsEnRoute);
				console.log('');
				if (order.productsEnRoute[j] === drone.product) {
					count++;
				}
			}

			cmdDeliver(i, order.id, drone.product, count);

			drone.targets.splice(0, 1);
		}
	}

	turn++;
}





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
	var drone = drones[droneId];
	var warehouse = warehouses[warehouseId];

	commands[commandCount++] = droneId + ' ' +'L' + ' ' + warehouseId + ' ' + productType + ' ' + productCount;

	drone.mode = 'load';
	drone.timeBusy = calcTimeForDistance(drone.x, drone.y, warehouse.x, warehouse.y) + 1; // +1 for loading time
	drone.x = warehouse.x;
	drone.y = warehouse.y; // By the time we care again this will be the drone's location
	drone.product = productType;
	drone.productCount = productCount;
	warehouse.products[productType] -= productCount;
}

function cmdUnload(droneId, warehouseId, productType, productCount) {
	commands[commandCount++] = droneId + ' ' +'U' + ' ' + warehouseId + ' ' + productType + ' ' + productCount;
}

function cmdDeliver(droneId, customerId, productType, productCount) {
	var drone = drones[droneId];
	var order = orders[customerId];

	commands[commandCount++] = droneId + ' ' +'D' + ' ' + customerId + ' ' + productType + ' ' + productCount;

	drone.mode = 'deliver';
	drone.timeBusy = calcTimeForDistance(drone.x, drone.y, order.x, order.y) + 1; // +1 for loading time
	drone.x = order.x;
	drone.y = order.y; // By the time we care again this will be the drone's location
	drone.productCount -= productCount;
}

function cmdWait(droneId, turns) {
	commands[commandCount++] = droneId + ' ' + 'W' + ' ' + turns;
}

function updateDrone(droneId) {
	var drone = drones[droneId];

	console.log('Update drone ', droneId);
	console.log('\tmode: ', drone.mode);
	console.log('\tbusy: ', drone.timeBusy);

	if (drone.timeBusy > 1) {
		drone.timeBusy--;
	} else if (drone.timeBusy == 1) {
		drone.timeBusy--;

		// Load or fulfill orders
		if (drone.mode == 'load') {
			// Nothing to do - we preloaded it on issuing the command
		} else if (drone.mode == 'deliver') {
			// var order = orders[drone.targets[0]];
			// while (drone.productCount > 0) {
			// 	order.productsEnRoute.splice(order.productsEnRoute.indexOf(drone.product));
			// 	order.productsDelivered.push(drone.product);
			// 	drone.product
			// }
		}

		// Reset
		drone.mode = 'idle';
	}
}

function compareOrderByProductCountAsc(orderA, orderB) {
	return orderA.productsWanted.length - orderB.productsWanted.length;
}

function calcTimeForDistance(x1, y1, x2, y2) {
	var x = x1 - x2;
	var y = y1 - y2;

	return Math.ceil(Math.sqrt(x * x + y * y));
}