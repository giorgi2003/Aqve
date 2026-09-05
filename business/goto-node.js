(function () {
  fetch("/api/health", { cache: "no-store" })
    .then(function (res) {
      if (res.ok) return;
      goNode();
    })
    .catch(goNode);

  function goNode() {
    if (location.port === "5501") return;
    var path = (location.pathname || "/business/dashboard").replace(/\/+$/, "") || "/business/dashboard";
    location.replace(location.protocol + "//" + location.hostname + ":5501" + path + location.search + location.hash);
  }
})();
