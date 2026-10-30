/* Русская типографика для строк, которые страница вставляет из JS (данные каталога, отзывы).
   Статичный HTML обрабатывает scripts/typograph.py — списки слов здесь те же, что в scripts/audit.py.
   Подключение: <script src="js/typo.js"></script>, затем element.textContent = typo(строка). */
(function () {
  var NB = " ";
  var FWD = "а аж без в ваш весь во вот все вся вы где да для до его если ещё её за и из из-за из-под или их к как ко когда куда между мой мы на над наш не нет ни но ну о об обо около он она они от перед по по-над под после при про с со та так там твой те тем то той тот ты у уж уже чем через что чтобы эти это этой этот я".split(" ");
  var BACK = "же ли бы б ж".split(" ");
  window.typo = function (s) {
    if (!s) return "";
    s = s.replace(/(?<=^|[\s («"])([А-Яа-яЁё]+(?:-[а-я]+)?,?) (?=\S)/g, function (m, w) {
      return FWD.indexOf(w.toLowerCase().replace(/,$/, "")) >= 0 ? w + NB : m;
    });
    s = s.replace(/ ([А-Яа-яЁё]{1,2})(?=[\s.,!?…]|$)/g, function (m, w) {
      return BACK.indexOf(w.toLowerCase()) >= 0 ? NB + w : m;
    });
    s = s.replace(/(\S) —/g, "$1" + NB + "—");
    s = s.replace(/(\d) (\d{3})(?!\d)/g, "$1" + NB + "$2");
    s = s.replace(/(\d) (₽|%|°C|°|кг|см|мм|г|м)(?=[\s.,;:!?)»]|$)/g, "$1" + NB + "$2");
    return s;
  };
})();
