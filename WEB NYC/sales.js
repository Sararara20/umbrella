const tableData = document.getElementById("data-table");
const filterYearElement = document.getElementById("year");
const sortDataTable = document.getElementById("sort-data-table-sales-price");
const filterBoroughElement = document.getElementById("borough-filter");
const rowLimitElement = document.getElementById("row-limit");

sortDataTable.addEventListener("change", renderDataBySortDataTable);
rowLimitElement.addEventListener("change", renderDataByRowLimit);

const IDR = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function fetchDataJson(year, borough = "", sort = "", limit = rowLimitElement.value) {
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

      const yearData = dataSlice.map((el) => Number(el["SALE_DATE"].split("-")[0]));
      const yearDataMap = [...new Set(yearData)].sort((a,b)=> a-b);

      if (!year && filterYearElement.options.length <= yearDataMap.length) {
        for (let i = 0; i < yearDataMap.length; i++) {
          const optionElement = document.createElement("option");
          optionElement.value = yearDataMap[i];
          optionElement.innerText = yearDataMap[i];
          filterYearElement.appendChild(optionElement);
        }

        filterYearElement.addEventListener("change", renderDataByFilterYear);
      }

      const boroughData = dataSlice.map((el) => el["BOROUGH"]);
      const boroughDataMap = [...new Set(boroughData)].sort();

      if (!borough && filterBoroughElement.options.length <= boroughDataMap.length) {
        for (let i = 0; i < boroughDataMap.length; i++) {
          const optionElement = document.createElement("option");
          optionElement.value = boroughDataMap[i];
          optionElement.innerText = boroughDataMap[i];
          filterBoroughElement.appendChild(optionElement);
        }

        filterBoroughElement.addEventListener("change", renderDataByFilterBorough);
      }

      while (tableData.firstChild) {
        tableData.removeChild(tableData.lastChild);
      }
      renderTable(1, limit, year, sort, borough, dataSlice);
    })
    .catch((error) => {
      console.log({ error });
    });
}

fetchDataJson(); // First render

function renderDataByFilterYear(el) {
  return fetchDataJson(el.target.value, filterBoroughElement.value, sortDataTable.value);
}

function renderDataByFilterBorough(el) {
  return fetchDataJson(filterYearElement.value, el.target.value, sortDataTable.value);
}

function renderDataBySortDataTable(el) {
  return fetchDataJson(filterYearElement.value, filterBoroughElement.value, el.target.value);
}

function renderDataByRowLimit() {
  fetchDataJson(filterYearElement.value, filterBoroughElement.value, sortDataTable.value);
}

function renderTable(page, limit, year, sort = "", borough = "", data) {
  const filteredData = year
    ? data.filter((el) => el["SALE_DATE"].split("-")[0] === year)
    : data;

  const filteredByBoroughData = borough
    ? filteredData.filter((el) => el["BOROUGH"] === borough)
    : filteredData;

  if (sort === "asc") {
    filteredByBoroughData.sort((a, b) => a["SALE_PRICE"] - b["SALE_PRICE"]);
  }

  if (sort === "desc") {
    filteredByBoroughData.sort((a, b) => b["SALE_PRICE"] - a["SALE_PRICE"]);
  }

  for (let i = 0; i < filteredByBoroughData.length; i++) {
    if (i >= (page - 1) * limit && i < limit * page) {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      const td2 = document.createElement("td");
      const td3 = document.createElement("td");
      const td4 = document.createElement("td");
      const td5 = document.createElement("td");
      const td6 = document.createElement("td");

      td1.innerText = i + 1;
      td2.innerText = filteredByBoroughData[i].BOROUGH;
      td3.innerText = filteredByBoroughData[i].NEIGHBORHOOD;
      td4.innerText = filteredByBoroughData[i]['LOT'];
      td5.innerText = IDR.format(filteredByBoroughData[i]["SALE_PRICE"]);
      td6.innerText = filteredByBoroughData[i]["SALE_DATE"];

      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tr.appendChild(td4);
      tr.appendChild(td5);
      tr.appendChild(td6);

      tableData.appendChild(tr);
    }
  }
}
