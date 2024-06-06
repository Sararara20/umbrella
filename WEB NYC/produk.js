const totalUnit = document.getElementById("total-unit");
const totalSalesPrice = document.getElementById("total-sales-price");
const averageSales = document.getElementById("average-sales");
const totalCommercial = document.getElementById("total-commercial-unit");
const totalResidential = document.getElementById("total-residential-unit");
const totalTransaction = document.getElementById("total-transaction");
const filterYearElement = document.getElementById("year");

const IDR = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

let transactionsChart1; // Global variable to hold the first chart instance
let transactionsChart2; // Global variable to hold the second chart instance
let transactionsChart3; // Global variable to hold the third chart instance (line chart)
let transactionsChart4; // Global variable to hold the fourth chart instance (line chart for sales price)
let transactionsChart5; // Global variable to hold the fifth chart instance (pie chart for total sales price by building class category)
let transactionsChart6; // Global variable to hold the sixth chart instance (horizontal bar chart for sales price by neighborhood)

function fetchDataJson(year) {
  fetch("./DATA10.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      const dataSlice = year
        ? data.filter((el) => el["SALE_DATE"].split("-")[0] === year)
        : data;

      const dataSalesObject = {}; // { QUEENS: totalSalesPrice, MANHATTAN: totalSalesPrice, ...}
      const dataTransactionsObject = {}; // { QUEENS: 10, MANHATTAN: 20, ...}
      const dataTransactionsMonthlyObject = {}; // { '2023-01': 10, '2023-02': 15, ...}
      const dataSalesMonthlyObject = {}; // { '2023-01': 100000, '2023-02': 150000, ...}
      const dataSalesBuildingCategory = {}; // { '01 ONE FAMILY HOMES': totalSalesPrice, '02 TWO FAMILY HOMES': totalSalesPrice, ... }
      const dataSalesNeighborhood = {};


      for (let i = 0; i < dataSlice.length; i++) {
        const borough = dataSlice[i].BOROUGH;
        const salePrice = Number(dataSlice[i]["SALE_PRICE"]);
        const saleDate = dataSlice[i]["SALE_DATE"].slice(0, 7); // Get YYYY-MM format
        const buildingCategory = dataSlice[i]["BUILDING_CLASS_CATEGORY"];
        const neighborhoodCategory = dataSlice[i]["NEIGHBORHOOD"];


        if (isNaN(salePrice)) {
          // Skip entries with invalid or missing sale price
          continue;
        }

        if (dataSalesObject[borough]) {
          dataSalesObject[borough] += salePrice;
        } else {
          dataSalesObject[borough] = salePrice;
        }

        if (dataTransactionsObject[borough]) {
          dataTransactionsObject[borough] += 1;
        } else {
          dataTransactionsObject[borough] = 1;
        }

        if (dataTransactionsMonthlyObject[saleDate]) {
          dataTransactionsMonthlyObject[saleDate] += 1;
        } else {
          dataTransactionsMonthlyObject[saleDate] = 1;
        }

        if (dataSalesMonthlyObject[saleDate]) {
          dataSalesMonthlyObject[saleDate] += salePrice;
        } else {
          dataSalesMonthlyObject[saleDate] = salePrice;
        }

        if (dataSalesBuildingCategory[buildingCategory]) {
          dataSalesBuildingCategory[buildingCategory] += salePrice;
        } else {
          dataSalesBuildingCategory[buildingCategory] = salePrice;
        }

        if (dataSalesNeighborhood[neighborhoodCategory]) {
          dataSalesNeighborhood[neighborhoodCategory] += salePrice;
        } else {
          dataSalesNeighborhood[neighborhoodCategory] = salePrice;
        }
      }

      const yearData = dataSlice.map((el) => Number(el["SALE_DATE"].split("-")[0]));
      const yearDataMap = [...new Set(yearData)].sort((a, b) => a - b);

      const totalLotData = dataSlice.reduce(
        (acc, curr) => acc + Number(curr["LOT"]),
        0
      );

      const totalSalesPriceData = dataSlice.reduce(
        (acc, curr) => acc + Number(curr["SALE_PRICE"]),
        0
      );

      const averageSalesData = totalSalesPriceData / dataSlice.length;

      const totalCommercialData = dataSlice.reduce(
        (acc, curr) => acc + Number(curr["COMMERCIAL_UNITS"]),
        0
      );

      const totalResidentialData = dataSlice.reduce(
        (acc, curr) => acc + Number(curr["RESIDENTIAL_UNITS"]),
        0
      );

      const totalUnitData = totalCommercialData + totalResidentialData;

      const formatTotalSales = IDR.format(totalSalesPriceData);
      const formatAverageSales = IDR.format(averageSalesData);
      const formatTotalUnit = totalUnitData.toLocaleString();
      const formatCommercial = totalCommercialData.toLocaleString();
      const formatResidential = totalResidentialData.toLocaleString();

      totalSalesPrice.innerHTML = formatTotalSales;
      averageSales.innerHTML = formatAverageSales;
      totalCommercial.innerHTML = formatCommercial;
      totalResidential.innerHTML = formatResidential;
      totalTransaction.innerHTML = dataSlice.length.toLocaleString();
      totalUnit.innerHTML = formatTotalUnit;

      if (
        !year &&
        filterYearElement.options.length <= yearDataMap.length
      ) {
        for (let i = 0; i < yearDataMap.length; i++) {
          const optionElement = document.createElement("option");
          optionElement.value = yearDataMap[i];
          optionElement.innerText = yearDataMap[i];
          filterYearElement.appendChild(optionElement);
        }

        filterYearElement.addEventListener("change", renderDataByFilterYear);
      }

      const labelTransactionsChart = Object.keys(dataTransactionsObject);
      const dataTransactionsChart = Object.values(dataTransactionsObject);
      const salesPrices = Object.values(dataSalesObject);

      // Destroy the previous chart instances if they exist
      if (transactionsChart1) {
        transactionsChart1.destroy();
      }
      if (transactionsChart2) {
        transactionsChart2.destroy();
      }
      if (transactionsChart3) {
        transactionsChart3.destroy();
      }
      if (transactionsChart4) {
        transactionsChart4.destroy();
      }
      if (transactionsChart5) {
        transactionsChart5.destroy();
      }
      if (transactionsChart6) {
        transactionsChart6.destroy();
      }

      const ctxBarChart1 = document.getElementById("chart-1").getContext("2d");
      transactionsChart1 = renderBarChart(ctxBarChart1, labelTransactionsChart, dataTransactionsChart, 'Total Transactions by Borough');

      const ctxBarChart2 = document.getElementById("chart-2").getContext("2d");
      transactionsChart2 = renderBarChart(ctxBarChart2, labelTransactionsChart, salesPrices, 'Total Sales Price by Borough', true);

      const monthlyLabels = Object.keys(dataTransactionsMonthlyObject).sort();
      const monthlyData = monthlyLabels.map(label => dataTransactionsMonthlyObject[label]);

      const ctxLineChart = document.getElementById("chart-3").getContext("2d");
      transactionsChart3 = renderLineChart(ctxLineChart, monthlyLabels, monthlyData, 'Total Transactions per Month');
      const monthlySalesData = monthlyLabels.map(label => dataSalesMonthlyObject[label]);

      const ctxLineChartSales = document.getElementById("chart-4").getContext("2d");
      transactionsChart4 = renderLineChart(ctxLineChartSales, monthlyLabels, monthlySalesData, 'Total Sales Price per Month');

      // Select top 5 building categories by sales price and sum up the rest
      const sortedBuildingCategories = Object.entries(dataSalesBuildingCategory).sort((a, b) => b[1] - a[1]);
      const top5Categories = sortedBuildingCategories.slice(0, 5);
      let otherTotalSales = 0;
      for (let i = 5; i < sortedBuildingCategories.length; i++) {
        otherTotalSales += sortedBuildingCategories[i][1];
      }
      top5Categories.push(["Other", otherTotalSales]);
      const top5Labels = top5Categories.map(entry => entry[0]);
      const top5Data = top5Categories.map(entry => entry[1]);

      const ctxPieChart = document.getElementById("chart-5").getContext("2d");
      transactionsChart5 = renderPieChart(ctxPieChart, top5Labels, top5Data, 'Total Sales Price by Building Class Category');

      // Horizontal Bar Chart for Neighborhood Sales Price
      const sortedNeighborhoods = Object.entries(dataSalesNeighborhood).sort((a, b) => b[1] - a[1]);
      const top10Neighborhoods = sortedNeighborhoods.slice(0, 10);
      const top10NeighborhoodsLabels = top10Neighborhoods.map(entry => entry[0]);
      const top10NeighborhoodsData = top10Neighborhoods.map(entry => entry[1]);

      const ctxBarChart6 = document.getElementById("chart-6").getContext("2d");
      transactionsChart6 = renderHorizontalBarChart(ctxBarChart6, top10NeighborhoodsLabels, top10NeighborhoodsData, 'Total Sales Price by Neighborhood');
    })
    .catch((error) => {
      console.log({ error });
    });
}

fetchDataJson(); // First render

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function renderBarChart(ctx, labels, data, title = "Sales Price") {
  const backgroundColors = labels.map(() => getRandomColor());
  const borderColors = backgroundColors.map(color => color.replace('0.2', '1'));

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: title,
          data: data,
          borderWidth: 1,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `# ${title}`,
        },
      },
    },
  });
}

function renderLineChart(ctx, labels, data, title = "Total Transactions per Month") {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `# ${title}`,
        },
      },
    }
  });
}

function renderPieChart(ctx, labels, data, title = "Total Sales Price by Building Class Category") {
  const backgroundColors = labels.map(() => getRandomColor());

  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: `# ${title}`,
        },
      },
    },
  });
}

function renderHorizontalBarChart(ctx, labels, data, title) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: labels.map(() => getRandomColor()),
        borderColor: labels.map(() => getRandomColor().replace('0.2', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // This is what makes the bar chart horizontal
      scales: {
        x: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `# ${title}`,
        },
      }
    }
  });
}

function renderDataByFilterYear(el) {
  fetchDataJson(el.target.value);
}
