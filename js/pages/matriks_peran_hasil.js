// Matriks Peran Hasil — uses DynImporter
(function () {
  Page.MatriksPeranHasil = function () {
    DynImporter.mountImporter({
      title: 'Matriks Peran Hasil',
      storeKey: 'matriks_peran_hasil_doc',
      onRefresh: () => Page.MatriksPeranHasil(),
      emptyHint: 'Import file Matriks Peran Hasil (Excel / Word / PDF) untuk menampilkannya di sini.',
    });
  };
})();
