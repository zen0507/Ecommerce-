function addToCart(proId) {
  $.ajax({
    url: "/add-to-cart/" + proId,
    method: "get",
    success: (response) => {
      if (response.status) {
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
      }
    },
  });
}

function changeQuantity(cartId, proId, count) {
  let quantityElement = $("#quantity-" + proId);
  let qty = parseInt(quantityElement.text());

  count = parseInt(count);

  $.ajax({
    url: "/change-product-quantity",
    data: {
      cart: cartId,
      product: proId,
      count: count,
      quantity: qty,
    },
    method: "post",
    success: (response) => {
      if (response.removeProduct) {
        alert("Product Removed From Cart");
        location.reload();
      } else {
        let currentQuantity = parseInt(quantityElement.text());

        quantityElement.text(currentQuantity + count);

        let cartCount = parseInt($("#cart-count").text());
        $("#cart-count").text(cartCount + count);
        $("#cart-total").text(response.total);

      }
    },
  });
}

function removeProduct(cartId, proId) {
  $.ajax({
    url: "/remove-cart-product",
    data: {
      cart: cartId,
      product: proId,
    },
    method: "post",
    success: (response) => {
      if (response.status) {
          $("#cart-total").text(response.total);

        location.reload();
      }
    },
  });
}

$(function () {
  const tables = $(".admin-data-table");
  const searchForm = document.getElementById("admin-table-search");

  if (!tables.length) {
    searchForm?.remove();
    return;
  }

  if (typeof DataTable === "undefined") {
    console.error("DataTables did not load; admin table search and sorting are unavailable.");
    return;
  }

  const dataTables = tables
    .toArray()
    .map((table) =>
      new DataTable(table, {
        order: [],
        columnDefs: [
          {
            targets: "_all",
            orderSequence: ["asc", "desc", ""],
          },
        ],
        language: {
          emptyTable: "No records available.",
        },
      }),
    );

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = new FormData(searchForm).get("q")?.toString() ?? "";

    dataTables.forEach((table) => table.search(query).draw());
  });
});
