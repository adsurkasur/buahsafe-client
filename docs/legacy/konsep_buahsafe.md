# BuahSafe

## Sistem Skrining Non-Destruktif Berbasis Transmisi Ultrasonik

## dan Machine Learning untuk Deteksi Dini Anomali Internal

## pada Jambu Kristal Pascapanen

**Versi Dokumen:** 1.
**Status:** Concept Paper
**Bidang:** Teknologi Pascapanen, Elektronika Terapan, Kecerdasan Buatan

## Abstrak

Jambu kristal ( _Psidium guajava_ L.) adalah komoditas hortikultura bernilai ekonomi tinggi yang kerap
mengalami masalah serius dalam proses quality control: kerusakan internal akibat infestasi lalat buah
dan pembusukan jaringan tidak dapat terdeteksi hanya dari pengamatan visual luar. Buah yang terlihat
sempurna dari luar dapat menyimpan kerusakan tersembunyi di dalamnya, yang baru terdeteksi setelah
sampai ke tangan konsumen dan menyebabkan kerugian ekonomi serta penurunan kepercayaan pasar.

BuahSafe adalah sistem skrining non-destruktif (tanpa merusak buah) yang dirancang untuk mendeteksi
indikasi anomali internal pada jambu kristal sebelum proses pengemasan. Sistem ini memanfaatkan
prinsip transmisi gelombang ultrasonik 40 kHz yang merambat menembus buah, dikombinasikan
dengan model machine learning yang terlatih untuk mengklasifikasikan kondisi internal buah
berdasarkan karakteristik sinyal yang diterima. Output sistem berupa status klasifikasi beserta
persentase keyakinan, sehingga operator quality control dapat mengambil keputusan dengan cepat dan
konsisten.

Konsep ini dirancang agar ekonomis, mudah dioperasikan oleh tenaga non-teknis, dan realistis untuk
dikembangkan dalam bentuk prototipe terapan skala UMKM agrikultur.

## Daftar Isi

1. Pendahuluan
2. Konsep Dasar Sistem
3. Deskripsi Sistem BuahSafe
4. Mekanisme Kerja Sistem
5. Machine Learning Pipeline
6. Metodologi Validasi


7. Keunggulan Sistem
8. Tantangan dan Keterbatasan
9. Rencana Pengembangan Lanjutan
10. Penutup
11. Glosarium

## 1. Pendahuluan

### 1.1 Latar Belakang

Jambu kristal ( _Psidium guajava_ L.) merupakan salah satu varietas jambu biji unggul yang memiliki
permintaan pasar tinggi karena karakteristiknya yang khas: rasa manis, tekstur renyah, daging putih
bersih, dan tampilan visual menarik. Di Indonesia, komoditas ini dipasarkan dalam bentuk buah segar
ke supermarket, restoran, hotel, dan kafe, dengan segmen pasar yang cukup premium.

Namun, di balik nilai ekonomisnya yang tinggi, jambu kristal menyimpan permasalahan serius yang
belum terpecahkan secara efektif dalam rantai produksi: **kerusakan internal yang tidak kasat
mata**. Buah dapat terlihat segar, mulus, dan layak jual dari luar, tetapi sebenarnya telah mengalami
kerusakan di bagian dalam.

Penyebab utama kerusakan tersembunyi ini adalah **infestasi lalat buah** ( _Bactrocera_ spp.).
Mekanismenya terjadi ketika lalat buah betina menusukkan ovipositornya (alat penyuntik telur) ke
dalam jaringan buah. Telur kemudian menetas di dalam buah menjadi larva yang memakan daging buah
dari dalam. Pada fase awal infestasi, permukaan buah belum menunjukkan tanda kerusakan yang jelas.
Akibatnya:

```
Larva dapat memakan jaringan buah hingga menyebabkan pelunakan lokal, pembentukan rongga,
perubahan kadar air, dan pembusukan progresif.
Kerusakan baru terlihat secara visual beberapa hari setelah buah dikemas dan dalam perjalanan
distribusi.
Produk yang sudah sampai ke konsumen atau gerai penjualan menjadi rusak, menyebabkan kerugian
ekonomi dan menurunnya kepercayaan pelanggan.
```
Selain infestasi lalat buah, pembusukan internal juga dapat dipicu oleh faktor lain seperti infeksi
mikroba, kerusakan mekanis pada jaringan dalam, dan kondisi penyimpanan yang tidak optimal. Semua
faktor ini menghasilkan perubahan pada struktur jaringan dalam buah yang tidak terlihat dari luar.
Proses inspeksi kualitas yang selama ini dilakukan umumnya berbasis **pengamatan visual manual** ,
yaitu tenaga kerja memeriksa buah satu per satu berdasarkan warna, bentuk, dan tekstur permukaan.
Metode ini memiliki keterbatasan fundamental: ia hanya mengevaluasi kondisi luar buah, sehingga sama
sekali tidak mampu mendeteksi anomali yang terjadi di dalam.

Diperlukan solusi yang mampu mendeteksi kondisi internal buah **tanpa harus membelah atau
merusaknya** agar buah yang lolos inspeksi benar-benar dalam kondisi baik. Pendekatan ini dikenal
dalam dunia teknik sebagai **Non-Destructive Testing (NDT)** atau pengujian tanpa merusak.


### 1.2 Rumusan Masalah

Berdasarkan latar belakang di atas, permasalahan utama yang ingin diselesaikan adalah:

1. Inspeksi visual manual tidak mampu mendeteksi kerusakan internal pada jambu kristal, sehingga
    produk rusak dapat lolos proses sortasi dan pengemasan.
2. Tidak tersedianya alat deteksi kerusakan internal yang ekonomis, mudah digunakan, dan sesuai
dengan skala operasional UMKM agrikultur.

### 1.3 Tujuan Pengembangan

1. Merancang dan mengembangkan sistem skrining non-destruktif berbasis transmisi ultrasonik yang
    mampu mengindikasikan anomali internal pada jambu kristal.
2. Mengintegrasikan model machine learning ke dalam sistem untuk meningkatkan akurasi dan
konsistensi klasifikasi dibandingkan pendekatan berbasis nilai ambang batas statis.
3. Menghasilkan output yang informatif berupa status kondisi buah disertai persentase keyakinan
sistem.
4. Mewujudkan prototipe yang operasional, ekonomis, dan dapat diterapkan dalam konteks UMKM
agrikultur.

### 1.4 Manfaat

**Bagi pelaku usaha (UMKM/produsen):** Mengurangi risiko distribusi produk rusak, menekan
kerugian akibat produk yang ditolak (rejected), dan meningkatkan konsistensi quality control.

**Bagi konsumen:** Memperoleh produk dengan jaminan kualitas internal yang lebih baik.

**Bagi dunia keilmuan:** Memberikan bukti konsep (proof of concept) penerapan transmisi ultrasonik
dan machine learning dalam inspeksi kualitas buah pascapanen pada skala yang terjangkau.

## 2. Konsep Dasar Sistem

Bagian ini menjelaskan fondasi ilmiah dan teknologi yang mendasari BuahSafe. Setiap konsep dijelaskan
dari dasar agar dapat dipahami tanpa latar belakang teknis terlebih dahulu.

### 2.1 Apa Itu Gelombang Ultrasonik?

Suara yang kita dengar sehari-hari adalah gelombang tekanan yang merambat melalui udara. Manusia
mampu mendengar suara dalam rentang frekuensi 20 Hz hingga 20.000 Hz (20 kHz). **Gelombang
ultrasonik** adalah gelombang suara dengan frekuensi di atas batas pendengaran manusia, yaitu lebih
dari 20.000 Hz.

```
Hz (Hertz) adalah satuan frekuensi yang menunjukkan berapa kali suatu gelombang berulang
dalam satu detik. kHz (kilohertz) = 1.000 Hz. Jadi 40 kHz berarti gelombang berulang 40.
kali per detik.
```

Meskipun tidak terdengar oleh manusia, gelombang ultrasonik tetap memiliki sifat fisika yang sama
dengan suara biasa: ia merambat, memantul, dan mengalami penyerapan (atenuasi) ketika melewati
suatu medium. Yang membedakannya adalah frekuensinya yang tinggi, yang memberikan beberapa
keunggulan teknis seperti kemampuan merambat dengan lebih terarah dan kemampuan menembus
material padat maupun semi-padat.

BuahSafe menggunakan gelombang ultrasonik dengan frekuensi **40 kHz** , yang merupakan frekuensi
standar yang umum digunakan dalam sensor ultrasonik airborne (merambat melalui udara).

### 2.2 Apa Itu Non-Destructive Testing (NDT)?

**Non-Destructive Testing (NDT)** , atau dalam bahasa Indonesia disebut **pengujian tanpa
merusak** , adalah sekumpulan metode untuk mengevaluasi kondisi suatu objek tanpa menyebabkan
kerusakan atau mengubah kondisi aslinya. Metode NDT secara luas digunakan dalam industri
manufaktur, konstruksi, dan penerbangan untuk mendeteksi cacat atau anomali pada material dan
komponen.

Contoh sederhana NDT dalam kehidupan sehari-hari: dokter menggunakan **ultrasonografi (USG)**
untuk melihat kondisi organ dalam tubuh pasien tanpa operasi. Prinsipnya serupa — gelombang suara
frekuensi tinggi dikirimkan ke dalam tubuh, dan responsnya dianalisis untuk mendapatkan informasi
tentang kondisi di dalamnya.

BuahSafe mengadopsi prinsip NDT dengan memanfaatkan gelombang ultrasonik sebagai "alat lihat" ke
dalam buah tanpa harus membelahnya.

### 2.3 Prinsip Transmisi Ultrasonik pada Buah

Dalam BuahSafe, metode yang digunakan adalah **transmisi ultrasonik** ( _through-transmission
ultrasonic_ ). Cara kerjanya:

1. Sebuah sensor ( **transmitter** ) memancarkan gelombang ultrasonik dari satu sisi buah.
2. Gelombang merambat menembus jaringan internal buah.
3. Sensor lain ( **receiver** ) di sisi berlawanan menerima gelombang yang telah melewati buah.
4. Sistem menganalisis karakteristik sinyal yang diterima.

Kunci dari metode ini adalah bahwa **karakteristik sinyal yang diterima sangat dipengaruhi oleh
kondisi medium yang dilalui gelombang**. Jaringan buah yang sehat bersifat relatif padat, homogen
(seragam), dan memiliki kadar air yang terdistribusi merata. Gelombang dapat merambat melaluinya
dengan redaman tertentu yang konsisten.
Sebaliknya, ketika jaringan buah mengalami kerusakan internal — akibat infestasi larva, pembusukan,
atau pelunakan — maka struktur jaringannya berubah:

```
Terbentuk rongga di mana larva mengonsumsi jaringan buah.
Jaringan menjadi lebih lunak dan tidak homogen.
Kadar air lokal berubah akibat aktivitas biologi larva dan proses pembusukan.
```
Perubahan struktur ini menyebabkan gelombang ultrasonik mengalami **penyerapan (atenuasi) yang
berbeda** dibandingkan saat melewati buah sehat. Secara teknis, ini tercermin dalam perubahan


**amplitudo sinyal** (kekuatan/intensitas sinyal) yang diterima oleh sensor receiver. Buah dengan
kerusakan internal cenderung menghasilkan sinyal yang lebih lemah atau memiliki pola amplitudo yang
berbeda dibandingkan buah yang sehat.

```
Amplitudo adalah ukuran kekuatan atau intensitas suatu gelombang. Pada konteks sinyal
listrik dari sensor, amplitudo diukur dalam satuan tegangan (Volt). Semakin besar amplitudo,
semakin kuat sinyal yang diterima.
```
Perubahan amplitudo inilah yang menjadi **dasar pengukuran** BuahSafe.

### 2.4 Machine Learning untuk Klasifikasi Sinyal

Pendekatan paling sederhana untuk membuat keputusan berdasarkan amplitudo sinyal adalah dengan
menetapkan sebuah nilai ambang batas ( _threshold_ ) secara manual: jika amplitudo di bawah nilai X, buah
dinyatakan berindikasi rusak; jika di atas X, buah normal. Pendekatan ini disebut _hardcoded threshold_.

Namun, pendekatan ini memiliki kelemahan: nilai ambang batas yang optimal bisa berbeda-beda
tergantung ukuran buah, tingkat kematangan, suhu lingkungan, dan variasi lainnya. Menetapkan satu
nilai ambang batas universal berisiko menghasilkan banyak kesalahan klasifikasi.

BuahSafe menggunakan pendekatan yang lebih canggih: **machine learning** (pembelajaran mesin).
Daripada menetapkan aturan secara manual, sistem _belajar sendiri_ pola pembeda antara buah sehat dan
buah berindikasi rusak dari data nyata yang dikumpulkan sebelumnya.

Penjelasan lebih rinci tentang machine learning dalam sistem BuahSafe dibahas pada Bab 5.

## 3. Deskripsi Sistem BuahSafe

### 3.1 Gambaran Umum

BuahSafe dirancang dalam bentuk sebuah **kotak pemindaian tertutup** ( _scan chamber_ ) berukuran
kompak. Sistem ini terdiri dari dua bagian utama yang bekerja secara terpadu:

**Bagian Hardware (Perangkat Keras):** Komponen fisik meliputi sensor ultrasonik, rangkaian
elektronik, mikrokontroler, dan struktur mekanik berupa kotak pemindaian.

**Bagian Software (Perangkat Lunak):** Program yang berjalan pada mikrokontroler untuk
mengontrol proses pengukuran, serta model machine learning yang digunakan untuk klasifikasi.

Alur penggunaan sistem secara singkat:

1. Operator membuka kotak pemindaian.
2. Buah jambu diletakkan pada dudukan di dalam kotak.
3. Kotak ditutup.
4. Operator menekan tombol scan.
5. Sistem memindai buah secara otomatis.


6. Hasil klasifikasi ditampilkan pada layar: kondisi buah beserta persentase keyakinan sistem.

### 3.2 Komponen Sistem

#### 3.2.1 Sensor Ultrasonik Piezoelektrik (Tipe EFR-RUB40K25)

Ini adalah komponen inti sistem — alat yang bertugas memancarkan dan menerima gelombang
ultrasonik.

Sensor ini bekerja berdasarkan **efek piezoelektrik**. Piezoelektrik adalah sifat material tertentu yang
dapat menghasilkan getaran mekanik (suara) ketika diberi sinyal listrik, dan sebaliknya, menghasilkan
sinyal listrik ketika menerima getaran mekanik. Material ini berfungsi seperti pengeras suara (speaker)
sekaligus mikrofon dalam satu jenis bahan.

Pada BuahSafe, digunakan **dua buah sensor piezoelektrik** :

```
Transmitter (pemancar): Sensor yang diberi sinyal listrik 40 kHz dan mengubahnya menjadi
gelombang ultrasonik yang dipancarkan ke arah buah.
Receiver (penerima): Sensor yang menerima gelombang ultrasonik yang telah melewati buah, lalu
mengubah getaran yang diterima kembali menjadi sinyal listrik.
```
Kedua sensor ini dipasang pada dinding-dinding kotak pemindaian yang saling berhadapan (misalnya
dinding kiri dan kanan, atau atas dan bawah), sehingga buah yang diletakkan di tengah berada di jalur
rambatan gelombang.
Alasan pemilihan sensor piezoelektrik (bukan sensor ultrasonik HC-SR04 yang umum dijual murah):
sensor HC-SR04 hanya mengukur **jarak** berdasarkan waktu tempuh pantulan gelombang, dan tidak
dirancang untuk menganalisis karakteristik sinyal secara rinci. Sensor piezoelektrik EFR-RUB40K25,
sebaliknya, merupakan **transduser ultrasonik** yang dirancang untuk analisis medium, sehingga lebih
sesuai untuk keperluan inspeksi material.

#### 3.2.2 Mikrokontroler ESP

**Mikrokontroler** adalah sebuah komputer mini dalam satu chip terintegrasi yang bertugas
mengendalikan seluruh sistem secara otomatis berdasarkan program yang ditanamkan di dalamnya.
Mikrokontroler memiliki kemampuan menerima input (data dari sensor), memproses data, dan
menghasilkan output (menampilkan hasil, mengaktifkan buzzer, dll.).

BuahSafe menggunakan **ESP32** , sebuah mikrokontroler modern berbasis arsitektur dual-core (dua inti
pemrosesan) yang memiliki fitur lengkap termasuk konektivitas WiFi dan Bluetooth, serta **ADC
(Analog to Digital Converter)** yang digunakan untuk membaca sinyal analog dari sensor.

Fungsi ESP32 dalam sistem BuahSafe:

1. Menghasilkan sinyal **PWM 40 kHz** untuk menggerakkan transmitter.
2. Mengontrol waktu dan urutan proses scanning.
3. Membaca sinyal analog dari receiver melalui ADC.
4. Memproses dan mengirim data ke model machine learning (melalui komputer pendamping pada fase
prototipe).


5. Menerima hasil klasifikasi dan menampilkannya di layar LCD.
6. Mengaktifkan buzzer sesuai hasil.

```
PWM (Pulse Width Modulation) adalah teknik menghasilkan sinyal listrik periodik
menggunakan mikrokontroler dengan cara mengatur lebar pulsa on/off secara cepat. Pada
BuahSafe, PWM digunakan untuk mensimulasikan sinyal AC (bolak-balik) 40 kHz yang
dibutuhkan transmitter ultrasonik.
```
#### 3.2.3 Rangkaian Penguat Sinyal — Signal Conditioning Amplifier (LM358)

Sinyal listrik yang dihasilkan oleh sensor receiver setelah menerima gelombang ultrasonik yang telah
melewati buah sangat **lemah** — amplitudonya sangat kecil, biasanya dalam kisaran milivolt (mV), jauh
di bawah rentang yang dapat dibaca secara stabil oleh ADC mikrokontroler.

Untuk mengatasi hal ini, sinyal receiver diperkuat terlebih dahulu menggunakan rangkaian penguat
sinyal berbasis **IC LM**.

```
IC (Integrated Circuit) adalah komponen elektronik berupa chip yang mengintegrasikan
banyak komponen kecil (transistor, resistor, kapasitor) dalam satu paket kecil. Op-Amp
(Operational Amplifier) adalah jenis IC yang berfungsi memperkuat sinyal listrik dengan
rasio penguatan yang dapat dikonfigurasi.
```
**LM358** adalah IC op-amp yang harganya terjangkau, mudah diperoleh, dan mampu bekerja dengan
baik pada frekuensi yang relevan untuk sistem ini. Dengan rangkaian penguat ini, sinyal dari receiver
diperkuat ke level yang dapat dibaca secara akurat oleh ADC ESP32.

Tanpa komponen ini, perubahan amplitudo yang terjadi akibat perbedaan kondisi internal buah
kemungkinan besar tidak akan terdeteksi secara konsisten.

#### 3.2.4 ADC (Analog to Digital Converter)

Sinyal dari dunia fisik — seperti tegangan dari sensor — bersifat **analog** , artinya nilainya bisa berupa
bilangan kontinu apa pun (misalnya 1,37 Volt). Komputer dan mikrokontroler, sebaliknya, hanya dapat
memproses data dalam bentuk **digital** , yaitu bilangan diskret (misalnya 0 dan 1, atau angka bulat dalam
rentang tertentu).

**ADC** adalah komponen yang bertugas mengubah sinyal analog menjadi data digital. ESP32 memiliki
ADC internal yang mampu membaca tegangan dan mengubahnya menjadi angka dalam rentang 0–
(resolusi 12-bit). Angka inilah yang kemudian diproses oleh sistem untuk analisis lebih lanjut.

#### 3.2.5 Layar LCD (Liquid Crystal Display)

**LCD** adalah layar tipis berbasis kristal cair yang digunakan sebagai antarmuka tampilan hasil untuk
operator. Pada BuahSafe, LCD menampilkan:

```
Status proses (misalnya: "Memindai...", "Siap")
Hasil klasifikasi (misalnya: "NORMAL" atau "TERINDIKASI ANOMALI")
Persentase keyakinan sistem (misalnya: "Keyakinan: 87%")
```

#### 3.2.6 Buzzer

**Buzzer** adalah komponen yang menghasilkan bunyi. Pada BuahSafe, buzzer berfungsi sebagai indikator
audio tambahan untuk operator: bunyi satu kali singkat untuk hasil normal, bunyi berbeda atau berulang
untuk indikasi anomali, sehingga operator tidak perlu terus-menerus menatap layar.

#### 3.2.7 Push Button (Tombol Tekan)

Tombol fisik yang digunakan operator untuk memulai proses scanning setelah buah diletakkan dan
chamber ditutup. Desain satu-tombol ini sengaja dipilih untuk meminimalkan kompleksitas operasional.

### 3.3 Desain Mekanik — Scan Chamber

Scan chamber adalah kotak pemindaian tertutup yang menjadi wadah fisik seluruh komponen dan
tempat proses pengukuran berlangsung. Desainnya mempertimbangkan beberapa aspek teknis:

**Material:** Chamber dapat dibuat dari akrilik, plywood, atau material ringan lainnya yang tidak terlalu
menyerap atau memantulkan gelombang ultrasonik secara berlebihan.

**Dimensi:** Dirancang cukup besar untuk menampung buah jambu kristal pada umumnya (diameter
sekitar 7–12 cm) beserta semua komponen internal, namun tetap kompak dan tidak memakan banyak
ruang meja kerja.

**Posisi Sensor:** Transmitter dan receiver dipasang pada dinding-dinding yang saling berhadapan di
dalam chamber — misalnya dinding kiri dan kanan — sehingga jalur gelombang ultrasonik melewati
posisi buah secara horizontal. Jarak antara kedua sensor bersifat tetap ( _fixed_ ) untuk menjaga konsistensi
pengukuran.

**Dudukan Buah (Foam Holder):** Buah diletakkan di atas dudukan berbentuk cekungan yang terbuat
dari foam lunak. Fungsi dudukan ini adalah:

```
Menjaga posisi buah tetap di tengah-tengah jalur antara transmitter dan receiver.
Memastikan buah tidak bergerak selama proses scanning.
Memberikan repeatability (hasil yang konsisten dan dapat diulang) antar pengukuran.
```
**Lapisan Peredam Akustik:** Bagian dalam dinding chamber dilapisi material penyerap suara seperti
foam akustik atau busa EVA. Lapisan ini berfungsi menyerap pantulan gelombang ultrasonik dari
dinding chamber yang dapat mengganggu sinyal utama (yang melewati buah). Tanpa peredam, sinyal
"echo" dari dinding akan bercampur dengan sinyal dari buah dan mempersulit analisis.

**Sistem Penutupan:** Chamber dilengkapi penutup (lid) yang dapat dibuka-tutup dengan mudah oleh
operator. Penutupan chamber selama proses scanning bertujuan meminimalkan gangguan suara dari
lingkungan sekitar.


## 4. Mekanisme Kerja Sistem

### 4.1 Alur Penggunaan (Sudut Pandang Operator)

Berikut adalah urutan langkah penggunaan BuahSafe dari sudut pandang staf quality control:

**Langkah 1 — Persiapan** Pastikan sistem dalam keadaan menyala. LCD akan menampilkan status
"Siap" atau instruksi awal.

**Langkah 2 — Memasukkan Buah** Buka penutup chamber, ambil satu buah jambu kristal, letakkan di
atas foam holder di dalam chamber.

**Langkah 3 — Menutup Chamber** Tutup penutup chamber untuk memastikan kondisi pengukuran
yang stabil dan terisolasi dari suara lingkungan.

**Langkah 4 — Memulai Scan** Tekan tombol scan. LCD akan menampilkan "Memindai..." selama
proses berlangsung (berlangsung beberapa detik).

**Langkah 5 — Membaca Hasil** Setelah proses selesai, LCD menampilkan hasil dan buzzer berbunyi.
Contoh tampilan hasil:

```
NORMAL
Keyakinan: 91%
```
atau

```
TERINDIKASI ANOMALI
Keyakinan: 84%
```
**Langkah 6 — Tindak Lanjut**

```
Jika hasil NORMAL : buah dikeluarkan dari chamber dan dilanjutkan ke proses berikutnya
(wrapping/pengemasan).
Jika hasil TERINDIKASI ANOMALI : buah dikeluarkan dan dipisahkan sebagai produk reject
untuk diverifikasi lebih lanjut (misalnya dengan membelah buah).
```
**Langkah 7 — Buah Berikutnya** Ulangi proses dari Langkah 2 untuk buah berikutnya.

### 4.2 Alur Pemrosesan Sinyal (Sudut Pandang Teknis)

Di balik antarmuka yang sederhana bagi operator, terjadi serangkaian proses teknis secara berurutan:

**Tahap 1 — Inisialisasi** Ketika tombol ditekan, ESP32 memulai siklus pengukuran.

**Tahap 2 — Pembangkitan Sinyal** ESP32 menghasilkan sinyal PWM dengan frekuensi 40 kHz selama
durasi tertentu (misalnya beberapa milidetik). Sinyal ini dikirimkan ke sensor transmitter.


**Tahap 3 — Pemancaran Gelombang** Transmitter mengubah sinyal listrik 40 kHz menjadi
gelombang ultrasonik dan memancarkannya ke arah buah.

**Tahap 4 — Perambatan Melalui Buah** Gelombang ultrasonik merambat melalui udara di dalam
chamber, memasuki jaringan buah, melewati seluruh bagian dalam buah, keluar dari sisi lain buah, dan
akhirnya mencapai sensor receiver.

**Tahap 5 — Penerimaan Sinyal** Receiver menangkap gelombang yang datang dan mengubahnya
kembali menjadi sinyal listrik analog. Amplitudo sinyal ini mencerminkan seberapa banyak energi
gelombang yang berhasil melewati buah.

**Tahap 6 — Penguatan Sinyal** Sinyal analog yang sangat lemah dari receiver diperkuat oleh rangkaian
LM358 hingga mencapai level yang dapat dibaca stabil oleh ADC.

**Tahap 7 — Digitalisasi** ADC pada ESP32 membaca tegangan sinyal yang telah diperkuat dan
mengubahnya menjadi nilai numerik digital (angka dalam rentang 0–4095). Pembacaan dilakukan
berulang kali (misalnya 100–200 kali) selama satu sesi scan untuk mendapatkan data yang representatif.

**Tahap 8 — Ekstraksi Fitur** Dari kumpulan nilai ADC yang terbaca, sistem mengekstrak fitur-fitur
numerik yang relevan (dibahas lebih rinci pada Bab 5).

**Tahap 9 — Klasifikasi** Fitur-fitur tersebut dimasukkan ke model machine learning yang telah terlatih.
Model menghasilkan probabilitas kondisi buah.

**Tahap 10 — Output** Hasil klasifikasi ditampilkan di LCD dan buzzer diaktifkan sesuai hasilnya.

## 5. Machine Learning Pipeline

Bab ini menjelaskan bagaimana sistem BuahSafe "belajar" mengenali perbedaan antara buah normal dan
buah berindikasi anomali, dari proses pengumpulan data hingga model siap digunakan.

### 5.1 Apa Itu Machine Learning?

**Machine learning** (pembelajaran mesin) adalah cabang kecerdasan buatan yang memungkinkan
komputer belajar dari data tanpa harus diprogram secara eksplisit untuk setiap aturan. Daripada
menulis aturan "jika nilai X maka hasilnya Y", kita memberikan komputer banyak contoh data beserta
jawabannya yang benar, dan komputer sendiri menemukan pola yang membedakan satu kategori dari
yang lain.

Analogi sederhana: bayangkan seseorang yang belum pernah melihat buah mangga busuk. Jika kita
tunjukkan ratusan contoh mangga sehat dan ratusan mangga busuk beserta keterangannya, lama-
kelamaan orang itu akan mampu membedakan sendiri mangga sehat dan busuk berdasarkan ciri-ciri
yang dia pelajari. Itulah prinsip dasar machine learning.

Dalam konteks BuahSafe, komputer "belajar" dari ratusan data pengukuran ultrasonik buah yang sudah
diketahui kondisi aslinya (sehat atau rusak), sehingga ketika diberikan data baru, komputer dapat
mengklasifikasikannya.


### 5.2 Jenis Pembelajaran: Supervised Learning

BuahSafe menggunakan pendekatan **supervised learning** (pembelajaran terawasi), yaitu jenis
machine learning di mana setiap data pelatihan sudah dilengkapi dengan **label** (jawaban yang benar).

Dalam hal ini:

```
Setiap pengukuran ultrasonik pada buah yang sudah dipastikan kondisinya akan dilabeli sebagai
"Normal" atau "Anomali".
Model belajar dari data berlabel ini untuk menemukan pola yang membedakan kedua kategori.
```
### 5.3 Pengumpulan Data (Data Collection)

Ini adalah tahap paling fundamental. Kualitas dan kuantitas data yang dikumpulkan akan sangat
menentukan performa model.

**Bahan yang dibutuhkan:**

```
Buah jambu kristal dalam kondisi sehat (tidak terinfestasi, tidak busuk).
Buah jambu kristal yang terindikasi rusak (terinfestasi lalat buah atau mengalami pembusukan
internal).
```
**Prosedur pengumpulan data:** Setiap buah dipindai menggunakan BuahSafe dan data mentah
pengukurannya disimpan. Selanjutnya, setiap buah **dibelah** untuk memverifikasi kondisi aslinya secara
visual. Berdasarkan hasil pembelahan inilah label diberikan.

Urutan prosedur ini penting: scan terlebih dahulu, baru belah. Pembelahan sebelum scan akan merusak
struktur internal buah dan menghasilkan data yang tidak representatif.

**Target jumlah sampel:** Untuk prototipe awal yang mampu memberikan hasil bermakna secara
statistik, ditargetkan minimal **50–100 buah per kategori** (sehat dan rusak), sehingga total minimal
sekitar 100–200 buah. Semakin banyak data, semakin baik kemampuan generalisasi model.

### 5.4 Pelabelan Data (Data Labeling)

Setelah buah dibelah dan kondisi dalamnya diamati secara visual, setiap rekaman data pengukuran
diberikan label:

```
Label 0 — Normal: Buah tidak menunjukkan kerusakan internal; jaringan buah sehat, tidak ada
larva, tidak ada rongga atau pembusukan.
Label 1 — Anomali: Buah menunjukkan satu atau lebih tanda kerusakan internal: ditemukan
larva/telur lalat buah, terdapat rongga, jaringan lunak tidak normal, atau tanda pembusukan.
```
Data berlabel ini menjadi **dataset pelatihan** (training dataset) yang akan digunakan untuk melatih
model.


### 5.5 Ekstraksi Fitur (Feature Extraction)

Model machine learning tidak bekerja langsung pada data mentah (ribuan nilai ADC mentah per scan).
Sebaliknya, dari data mentah tersebut diekstrak **fitur-fitur** (features): angka-angka ringkasan yang
paling informatif dan relevan.

```
Fitur dalam machine learning adalah variabel atau karakteristik numerik yang digunakan
sebagai input model. Analoginya seperti ciri-ciri yang digunakan untuk mendeskripsikan sebuah
objek secara kuantitatif.
```
Fitur-fitur yang diekstrak dari data pengukuran ultrasonik BuahSafe meliputi:

```
Fitur Penjelasan
Amplitudo rata-rata Nilai rata-rata dari semua pembacaan ADC selama satu sesi scan.
Merepresentasikan kekuatan sinyal rata-rata yang diterima.
Amplitudo
maksimum
```
```
Nilai tertinggi yang tercatat selama sesi scan.
```
```
Amplitudo minimum Nilai terendah yang tercatat.
Standar deviasi Ukuran seberapa besar variasi atau fluktuasi nilai selama sesi scan. Sinyal tidak
stabil bisa mengindikasikan kondisi internal tidak homogen.
Nilai RMS (Root
Mean Square)
```
```
Ukuran energi rata-rata sinyal. Lebih representatif dari rata-rata biasa untuk sinyal
periodik.
Rasio signal-to-noise Perbandingan antara kekuatan sinyal utama terhadap fluktuasi acak (noise).
```
```
Standar Deviasi adalah ukuran statistik yang menunjukkan seberapa jauh nilai-nilai dalam
suatu kumpulan data menyimpang dari nilai rata-ratanya. Standar deviasi tinggi berarti nilai-
nilainya sangat bervariasi; standar deviasi rendah berarti nilai-nilainya konsisten dan seragam.
```
```
RMS (Root Mean Square) adalah cara menghitung "rata-rata" khusus untuk sinyal yang
nilainya berubah-ubah positif dan negatif, dengan cara mengkuadratkan setiap nilai, merata-
ratakannya, lalu mengakar hasilnya.
```
Kumpulan fitur dari setiap buah membentuk satu baris data dalam dataset. Satu baris data = satu buah =
beberapa angka fitur + satu label.

### 5.6 Pelatihan Model (Model Training)

Pelatihan model dilakukan pada komputer (laptop/PC), bukan pada ESP32. Alurnya:

1. Dataset berlabel (kumpulan fitur + label dari ratusan buah) disiapkan.
2. Dataset dibagi menjadi dua bagian: **training set** (~80% data untuk melatih model) dan **test set**
(~20% data untuk mengevaluasi performa model pada data yang belum pernah dilihat).
3. Algoritma machine learning dilatih pada training set. Algoritma yang cocok untuk kasus ini meliputi:


```
Logistic Regression: Algoritma klasifikasi sederhana dan mudah diinterpretasi, cocok sebagai
baseline.
Support Vector Machine (SVM): Algoritma yang efektif untuk data berdimensi kecil dengan
batas keputusan yang jelas.
Random Forest: Algoritma berbasis kumpulan banyak pohon keputusan, umumnya
memberikan akurasi lebih baik dan tahan terhadap overfitting.
```
4. Performa model dievaluasi pada test set menggunakan metrik seperti akurasi, presisi, recall, dan F1-
    score.

```
Overfitting adalah kondisi ketika model terlalu "hafal" data pelatihan sehingga performa pada
data baru menjadi buruk. Ini seperti siswa yang menghafal jawaban latihan soal tanpa
memahami konsepnya, sehingga gagal saat menghadapi soal ujian yang berbeda.
```
```
Akurasi adalah proporsi prediksi yang benar dari total prediksi. Presisi mengukur seberapa
sering prediksi "Anomali" benar-benar adalah anomali. Recall mengukur seberapa banyak
kasus anomali yang berhasil dideteksi. F1-score adalah rata-rata harmonis presisi dan recall.
```
Dalam konteks deteksi kerusakan buah, **recall** sangat penting: sistem sebaiknya tidak melewatkan buah
yang sebenarnya rusak (false negative rendah), meskipun harus sedikit mengorbankan presisi.

### 5.7 Deployment Model — Integrasi ke Sistem

Pada fase prototipe awal, model yang telah terlatih berjalan pada **komputer pendamping** (laptop/PC)
yang terhubung ke ESP32 melalui koneksi serial (USB) atau WiFi.

Alur kerjanya:

1. ESP32 melakukan pengukuran dan ekstraksi fitur.
2. Data fitur dikirimkan ke komputer pendamping.
3. Komputer menjalankan model machine learning dan menghitung probabilitas.
4. Hasil dikirim kembali ke ESP32.
5. ESP32 menampilkan hasil di LCD.

Arsitektur ini dipilih untuk fase prototipe karena lebih mudah diuji, diperbaiki, dan dikembangkan. Pada
fase pengembangan selanjutnya, model dapat dikonversi ke format yang dapat berjalan langsung di
ESP32 menggunakan teknologi **TinyML** (TensorFlow Lite for Microcontrollers), sehingga sistem dapat
beroperasi sepenuhnya tanpa komputer pendamping.

### 5.8 Output: Persentase Keyakinan (Confidence Score)

Kebanyakan algoritma klasifikasi machine learning tidak hanya menghasilkan label (Normal/Anomali),
tetapi juga **probabilitas** — seberapa yakin model terhadap keputusannya. Probabilitas ini yang
ditampilkan sebagai "persentase keyakinan" di layar LCD.

Contoh interpretasi:


```
Tampilan LCD Interpretasi
NORMAL — Keyakinan: 95% Model sangat yakin buah ini normal
NORMAL — Keyakinan: 61% Model menilai normal, tetapi dengan keyakinan lebih rendah — mungkin
perlu inspeksi tambahan
TERINDIKASI ANOMALI — Keyaki
nan: 88%
```
```
Model cukup yakin ada indikasi kerusakan internal
```
```
TERINDIKASI ANOMALI — Keyaki
nan: 55%
```
```
Model ragu-ragu — buah berada di zona abu-abu, rekomendasikan
inspeksi manual
```
Penambahan persentase keyakinan ini memberikan informasi yang jauh lebih kaya dibanding sekadar
keputusan biner ya/tidak, sehingga operator dapat membuat keputusan yang lebih bijak — misalnya
memprioritaskan inspeksi manual untuk buah dengan keyakinan di zona menengah (50–70%).

## 6. Metodologi Validasi

Validasi sistem bertujuan memastikan bahwa BuahSafe benar-benar mengukur kondisi internal buah
(bukan sekadar menghasilkan angka acak), dan bahwa hasilnya dapat diandalkan dalam konteks
operasional nyata.

**Prosedur validasi:**

1. Kumpulkan set buah validasi yang terpisah dari data pelatihan (buah-buah baru yang belum pernah
    digunakan saat melatih model).
2. Pindai setiap buah menggunakan BuahSafe dan catat hasil klasifikasi beserta persentase keyakinan.
3. Belah setiap buah dan amati kondisi asli dalamnya oleh pemeriksa independen (tidak mengetahui
hasil sistem).
4. Bandingkan hasil sistem dengan kondisi aktual buah.

**Parameter evaluasi:
Akurasi keseluruhan:** Berapa persen dari total buah yang diklasifikasikan dengan benar?
**Sensitivity (Recall untuk kelas Anomali):** Dari semua buah yang benar-benar rusak, berapa
persen yang berhasil terdeteksi sistem?
**Specificity:** Dari semua buah yang benar-benar sehat, berapa persen yang diklasifikasikan dengan
benar sebagai normal?
**Konsistensi pengukuran:** Jika buah yang sama diukur berulang kali (tanpa dipindahkan),
seberapa konsisten hasilnya?

Validasi dilakukan dalam dua tahap: pertama di laboratorium dengan kondisi terkontrol, kemudian di
lingkungan operasional nyata (di lokasi mitra) untuk menguji ketahanan sistem terhadap variasi kondisi
lapangan.


## 7. Keunggulan Sistem

**Non-destruktif dan aman:** Buah tidak perlu dibelah, ditusuk, atau dirusak dalam bentuk apapun
selama proses inspeksi. Buah yang dinyatakan normal dapat langsung dilanjutkan ke proses
pengemasan.

**Mendeteksi apa yang tidak terlihat:** Sistem beroperasi berdasarkan kondisi internal buah, bukan
tampilan luar. Ini merupakan keunggulan fundamental dibandingkan inspeksi visual manual.

**Operasional sederhana:** Satu tombol, satu langkah penggunaan. Tidak memerlukan keahlian teknis
khusus dari operator.

**Output informatif:** Persentase keyakinan memberikan nuansa informasi yang membantu
pengambilan keputusan, bukan sekadar ya/tidak.

**Konsistensi:** Sistem tidak mengalami kelelahan, tidak terpengaruh subjektivitas, dan menghasilkan
hasil yang konsisten di setiap penggunaan — keunggulan signifikan dibandingkan inspeksi manual yang
bergantung pada kondisi dan ketelitian individu.

**Ekonomis dan skalabel:** Komponen yang digunakan (sensor piezoelektrik, ESP32, LM358)
merupakan komponen elektronik umum yang harganya terjangkau dan mudah diperoleh di pasar
komponen elektronik Indonesia.

**Potensi pengembangan:** Arsitektur sistem yang modular memungkinkan pengembangan lebih lanjut
menuju multi-sensor, on-device AI, monitoring database, hingga aplikasi pada komoditas buah lain.

## 8. Tantangan dan Keterbatasan

Sebagai langkah awal pengembangan, BuahSafe memiliki beberapa tantangan yang perlu diakui dan
direncanakan penanganannya:

**Variasi ukuran dan bentuk buah:** Jambu kristal memiliki variasi ukuran yang cukup besar.
Perbedaan ukuran mempengaruhi jarak antara permukaan buah dan sensor, yang pada gilirannya
mempengaruhi amplitudo sinyal. Penanganan: foam holder yang dirancang baik, normalisasi fitur dalam
proses ekstraksi, dan potensi penambahan sensor untuk mendeteksi posisi/ukuran buah.

**Sensitivitas terhadap kerusakan sangat awal:** Infestasi yang baru saja terjadi (telur baru
disuntikkan, belum menetas) kemungkinan belum menghasilkan perubahan struktur jaringan yang
cukup signifikan untuk terdeteksi sistem. Sistem lebih efektif dalam mendeteksi infestasi yang sudah
memasuki fase larva aktif.

**Kebutuhan kalibrasi dan data:** Model machine learning yang baik memerlukan data pelatihan yang
cukup banyak dan representatif. Pengumpulan data ini membutuhkan waktu, sumber daya, dan
ketelitian dalam proses labeling.


**Noise akustik lingkungan:** Meskipun chamber tertutup, suara lingkungan ekstrem (mesin berat,
getaran kuat) secara teoritis dapat mengganggu pengukuran. Dalam kondisi operasional normal UMKM
pertanian, hal ini umumnya tidak menjadi masalah signifikan.

**Tahap prototipe masih memerlukan komputer pendamping:** Pada versi prototipe awal, sistem
memerlukan laptop/PC untuk menjalankan model klasifikasi. Ini akan dieliminasi pada fase
pengembangan selanjutnya dengan penerapan TinyML.

## 9. Rencana Pengembangan Lanjutan

BuahSafe dirancang sebagai platform yang dapat dikembangkan secara bertahap:

**Fase 1 — Prototipe Dasar (saat ini):** Sistem satu-pasang-sensor (satu transmitter, satu receiver),
klasifikasi berbasis model machine learning yang berjalan di komputer pendamping, output LCD
sederhana. Tujuan: membuktikan konsep dan mengumpulkan data lapangan.

**Fase 2 — Peningkatan Akurasi:** Penambahan pasangan sensor dari sudut berbeda (misalnya
horizontal dan vertikal secara bersamaan) untuk mendapatkan gambaran kondisi internal buah yang
lebih komprehensif. Pengembangan model dengan dataset yang lebih besar.

**Fase 3 — Standalone (Mandiri):** Konversi model ke format TinyML dan deployment langsung pada
ESP32 atau mikrokontroler yang lebih bertenaga (ESP32-S3), sehingga sistem tidak lagi memerlukan
komputer pendamping.

**Fase 4 — Konektivitas dan Monitoring:** Integrasi dengan cloud database untuk pencatatan data
historis, monitoring jarak jauh, dan analisis tren kualitas produk dari waktu ke waktu.

**Fase 5 — Ekspansi Komoditas:** Pengujian dan adaptasi sistem untuk komoditas buah lain yang
memiliki permasalahan serupa (misalnya mangga, belimbing, atau buah-buahan lain yang rentan
infestasi lalat buah).

## 10. Penutup

BuahSafe adalah respons teknologi terhadap permasalahan nyata yang dihadapi pelaku usaha agrikultur:
ketidakmampuan metode inspeksi visual konvensional untuk mendeteksi kerusakan internal buah yang
tidak kasat mata.

Dengan memanfaatkan prinsip transmisi gelombang ultrasonik 40 kHz yang merambat menembus
jaringan buah, dikombinasikan dengan kecerdasan machine learning yang belajar dari data nyata, sistem
ini bertujuan memberikan alat quality control yang lebih objektif, konsisten, dan informatif
dibandingkan pengamatan manual.

Konsep ini dirancang dengan mempertimbangkan realitas skala UMKM: komponen yang ekonomis,
operasional yang sederhana, dan jalur pengembangan yang realistis. BuahSafe bukan sekadar alat,
melainkan sebuah langkah awal menuju sistem inspeksi kualitas pascapanen yang lebih cerdas dan dapat


diandalkan.

## Glosarium

Berikut adalah daftar istilah teknis yang digunakan dalam dokumen ini beserta penjelasannya dalam
bahasa yang mudah dipahami.


```
Istilah Penjelasan
```
**ADC (Analog to Digital
Converter)**

```
Komponen yang mengubah sinyal listrik analog (nilai kontinu) menjadi data
digital (bilangan diskret) yang dapat diproses komputer atau mikrokontroler.
```
**Amplitudo** Ukuran kekuatan atau intensitas suatu gelombang atau sinyal listrik. Pada sinyal
listrik, diukur dalam satuan Volt (V) atau milivolt (mV).

**Anomali Internal** Kondisi tidak normal pada bagian dalam buah yang tidak terlihat dari
permukaan luar, seperti adanya larva, rongga, atau jaringan yang membusuk.

**Atenuasi** Pengurangan kekuatan (amplitudo) gelombang saat merambat melalui suatu
medium. Buah dengan kerusakan internal cenderung menyebabkan atenuasi
yang lebih besar.

**Buzzer** Komponen elektronik yang menghasilkan bunyi ketika diberi arus listrik,
digunakan sebagai indikator audio.

**Confidence Score
(Persentase Keyakinan)**

```
Angka yang menunjukkan seberapa yakin model machine learning terhadap
keputusan klasifikasi yang dibuatnya, dinyatakan dalam persentase.
```
**Data Labeling (Pelabelan
Data)**

```
Proses memberikan jawaban yang benar (label/kategori) pada setiap data dalam
dataset pelatihan machine learning.
```
**Dataset** Kumpulan data terstruktur yang digunakan untuk melatih dan mengevaluasi
model machine learning.

**ESP32** Mikrokontroler modern berbasis dual-core dengan fitur WiFi dan Bluetooth,
diproduksi oleh Espressif Systems. Digunakan sebagai otak pengendali sistem
BuahSafe.

**Feature Extraction
(Ekstraksi Fitur)**

```
Proses mengubah data mentah menjadi angka-angka ringkasan yang paling
informatif sebagai input model machine learning.
```
**Foam Holder** Dudukan berbentuk cekungan dari bahan foam lunak yang digunakan untuk
menempatkan dan menstabilkan posisi buah di dalam chamber.

**F1-Score** Metrik evaluasi model machine learning yang menggabungkan presisi dan recall
dalam satu angka tunggal. Semakin tinggi (mendekati 1 atau 100%), semakin
baik.

**Hz (Hertz)** Satuan frekuensi, menyatakan jumlah siklus gelombang per detik. kHz =
kilohertz = 1.000 Hz.

**IC (Integrated Circuit)** Komponen elektronik berupa chip yang mengintegrasikan banyak komponen
kecil dalam satu paket. Sering disebut "chip".

**Infestasi** Serangan atau keberadaan organisme pengganggu (dalam konteks ini: larva lalat
buah) di dalam atau pada buah.

**LCD (Liquid Crystal
Display)**

```
Jenis layar tipis berbasis teknologi kristal cair yang umum digunakan sebagai
antarmuka tampilan pada perangkat elektronik.
```
**LM358** IC op-amp (penguat sinyal) dua saluran yang umum dan murah, digunakan
dalam BuahSafe untuk memperkuat sinyal lemah dari sensor receiver.


```
Istilah Penjelasan
```
**Machine Learning** Cabang kecerdasan buatan yang memungkinkan komputer belajar pola dari data
tanpa harus diprogram secara eksplisit untuk setiap aturan.

**Mikrokontroler** Komputer mini dalam satu chip terintegrasi yang dirancang untuk
mengendalikan perangkat elektronik secara otomatis.

**NDT (Non-Destructive
Testing)**

```
Pengujian tanpa merusak: metode untuk mengevaluasi kondisi suatu objek tanpa
menyebabkan kerusakan pada objek tersebut.
```
**Op-Amp (Operational
Amplifier)**

```
Jenis IC yang berfungsi memperkuat sinyal listrik. Komponen dasar dalam
banyak rangkaian elektronik analog.
```
**Overfitting** Kondisi model machine learning yang terlalu "hafal" data pelatihan sehingga
performanya buruk pada data baru yang belum pernah dilihat.

**Piezoelektrik** Sifat material yang menghasilkan getaran mekanik ketika diberi sinyal listrik,
dan sebaliknya menghasilkan sinyal listrik ketika menerima getaran. Digunakan
dalam sensor ultrasonik BuahSafe.

**Presisi (Precision)** Proporsi prediksi "Anomali" yang benar-benar merupakan anomali. Presisi
tinggi berarti sistem jarang salah menuding buah sehat sebagai rusak.

**PWM (Pulse Width
Modulation)**

```
Teknik menghasilkan sinyal listrik periodik dengan mikrokontroler melalui
pengaturan lebar pulsa on/off secara cepat.
```
**Recall (Sensitivity)** Proporsi kasus anomali yang berhasil terdeteksi sistem. Recall tinggi berarti
sistem jarang melewatkan buah yang sebenarnya rusak.

**Receiver** Sensor yang bertugas menerima gelombang ultrasonik setelah melewati buah
dan mengubahnya menjadi sinyal listrik.

**RMS (Root Mean
Square)**

```
Metode perhitungan untuk mendapatkan nilai "rata-rata efektif" sinyal yang
berubah-ubah, dengan mengkuadratkan nilai, merata-ratakannya, lalu mengakar
hasilnya.
```
**Scan Chamber** Kotak pemindaian tertutup tempat proses pengukuran ultrasonik berlangsung,
dirancang untuk menjaga kondisi pengukuran yang stabil dan terisolasi.

**Signal Conditioning** Proses mengkondisikan sinyal (misal: memperkuat, menyaring noise) agar dapat
dibaca secara akurat oleh sistem.

**Standar Deviasi** Ukuran statistik seberapa jauh nilai-nilai dalam suatu kumpulan data
menyimpang dari rata-ratanya.

**Supervised Learning** Pendekatan machine learning di mana model dilatih menggunakan data yang
sudah dilabeli (memiliki jawaban yang benar).

**Threshold (Nilai
Ambang Batas)**

```
Nilai batas yang digunakan untuk membuat keputusan: nilai di atas threshold
masuk satu kategori, di bawahnya masuk kategori lain.
```
**TinyML** Teknologi yang memungkinkan model machine learning berjalan langsung pada
mikrokontroler berdaya rendah tanpa memerlukan komputer eksternal.

**Training Set** Bagian dari dataset yang digunakan untuk melatih model machine learning.

**Transmitter** Sensor yang bertugas memancarkan gelombang ultrasonik ke arah buah.


```
Istilah Penjelasan
Transmisi Ultrasonik Metode NDT di mana gelombang ultrasonik dipancarkan dari satu sisi objek dan
diterima di sisi berlawanan setelah melewati objek.
Test Set Bagian dari dataset yang disimpan terpisah dan digunakan untuk mengevaluasi
performa model setelah pelatihan.
Ultrasonik Gelombang suara dengan frekuensi di atas batas pendengaran manusia
(>20.000 Hz).
```
_Dokumen ini merupakan concept paper tahap awal yang dapat diperbarui seiring perkembangan
desain dan hasil pengujian sistem._


