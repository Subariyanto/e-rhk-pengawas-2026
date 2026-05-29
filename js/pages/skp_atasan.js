// SKP Atasan Langsung — uses DynImporter
(function () {
  Page.SKPAtasan = function () {
    DynImporter.mountImporter({
      title: 'SKP Atasan Langsung',
      storeKey: 'skp_atasan_doc',
      onRefresh: () => Page.SKPAtasan(),
      emptyHint: 'Import file SKP Atasan Langsung (Excel / Word / PDF) untuk menampilkannya di sini.',
    });
  };
})();
