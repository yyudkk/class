// ===== DATA ANGGOTA KELAS X RPL 1 =====
// Struktur Kelas: Ketua, Wakil, Bendahara 1&2, Sekretaris 1&2, Kebersihan 1&2
// Ditambah 32 anggota lainnya. Total 40 siswa.

var KELAS = {
  nama: "X RPL 1",
  sekolah: "SMK TARUNA BHAKTI",
  tahun: "2026/2027",
  wali: "Pak Basit",
  foto: "assets/class-photo.svg",
  logo: "assets/logo.svg",
};

// Password admin untuk masuk ke Panel Admin.
var ADMIN_PASSWORD = "yudha123";

var ANGGOTA = [
  // ===== STRUKTUR KELAS =====
  {
    id: "azka",
    name: "Azka",
    fullname: "Azka Ridho Alkhafi",
    gender: "L",
    role: "Ketua Kelas",
    birth: "15 September 2010",
    hobby: "Mendengar musik, dan lagu",
    motto: "Don't Stop when you're tired, stop when you're done.",
    sosmed: {
      instagram: "https://instagram.com/azkardkhaf?igsh=MXJodml3aWNwYzdsQQ==",
    },
    songs: [
      { title: "Lathi", artist: "Weird Genius ft. Sara Fajira", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Kunang-Kunang", artist: "Virgoun", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    ],
  },
  {
    id: "erlin",
    name: "Erlina",
    fullname: "Erlina Rahma Syabannisa",
    gender: "P",
    role: "Wakil Ketua Kelas",
    birth: "30 Juli 2010",
    hobby: "Membaca dan Mendengar lagu",
    motto: "i don't love you anything you want.",
    sosmed: {
      instagram: "https://instagram.com/errlinrsnn?igshid=ajltY2MzYTZmcGg5",
    },
    songs: [
      { title: "Sisa Rasa", artist: "Mahalini", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Halu", artist: "Feby Putri", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    ],
  },
  {
    id: "Kezya",
    name: "Kezya",
    fullname: "Kezya Herwin Dwiranti",
    gender: "P",
    role: "Bendahara 1",
    birth: "11 Agustus 2010",
    hobby: "Membaca, dan Menari",
    motto: "Belajar dengan tekun, Berkarya dengan nyata, Berprestasi dengan bangga.",
    sosmed: {
      instagram: "https://instagram.com/lluvvzya",
    },
    songs: [
      { title: "Terlukis Indah", artist: "Rizky Febian ft. Ziva Magnolya", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Melukis Senja", artist: "Budi Doremi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
    ],
  },
  {
    id: "Yudha",
    name: "yyudkk",
    fullname: "Dwi Yudha Hariyanto",
    gender: "L",
    role: "Bendahara 2",
    birth: "22 September 2010",
    hobby: "Push Portofoilio",
    motto: "Perlahan tapi pasti.",
    sosmed: {
      instagram: "https://instagram.com/yyudkk_",
    },
    songs: [
      { title: "Runtuh", artist: "Feby Putri ft. Fiersa Besari", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Asmalibrasi", artist: "Soegi Bornean", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    ],
  },
  {
    id: "Ikawati",
    name: "Ika",
    fullname: "Ikawati Rahmi Puspita",
    gender: "P",
    role: "Sekretaris 1",
    birth: "6 Agustus 2010",
    hobby: "Traveling",
    motto: "Grow through what you go through.",
    sosmed: {
      instagram: "https://instagram.com/_iikkhaaaaa__",
    },
    songs: [
      { title: "Surat Cinta Untuk Starla", artist: "Virgoun", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "Matahariku", artist: "Agnes Monica", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
    ],
  },
  {
    id: "Hafizh",
    name: "Apis",
    fullname: "Hafizh Raviandy Ibrahim",
    gender: "L",
    role: "Sekretaris 2",
    birth: "23 September 2010",
    hobby: "Bermain Basket",
    motto: "Teruslah berkarya untuk masa depan yang cerah",
    sosmed: {
      instagram: "https://instagram.com/h.r.ibrahim",
    },
    songs: [
      { title: "Kata Mereka", artist: "Juicy Luicy", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { title: "Penjaga Hati", artist: "Nadhif Basalamah", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
    ],
  },

  // ===== 34ANGGOTA KELAS LAINNYA =====
  {
    id: "Mahesa",
    name: "Mahes",
    fullname: "Muhammad Mahesa Fadlu R.",
    gender: "L",
    role: "MEMBER IN X RPL 1",
    birth: "27 July 2010",
    hobby: "Playing a games and Basketball",
    motto: "Game4life.",
    sosmed: { instagram: "https://instagram.com/hesheshses" },
    songs: [
      { title: "Asmalibrasi", artist: "Soegi Bornean", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3" },
      { title: "Somebody's Pleasure", artist: "Aziz Hedra", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3" },
    ],
  },
  {
    id: "Reifan",
    name: "Epan",
    fullname: "Abdi Reifan Iniesta R.",
    gender: "L",
    role: "MEMBER IN X RPL 1",
    birth: "15 Agustus 2010",
    hobby: "Bermain Badminto, dan Bermain Basket",
    motto: "Rajin Pangkal Sukses.",
    sosmed: { instagram: "https://instagram.com/lahinipanep" },
    songs: [
      { title: "Walau Badai Menghadang", artist: "Ndx Aka", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3" },
      { title: "Cinta Dalam Doa", artist: "Lagu Kenangan", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3" },
    ],
  },
  {
    id: "Faris",
    name: "Paris",
    fullname: "Ahmad Faris Habburrahman",
    gender: "L",
    role: "MEMBER IN X RPL 1",
    birth: "20 Desember 2010",
    hobby: "Running and Traveling",
    motto: "everyone keeps telling me how my story is supposed to go, nah im ma do own thing.",
    sosmed: { instagram: "https://instagram.com/fariss_faa01" },
    songs: [
      { title: "Sisa Rasa", artist: "Mahalini", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-21.mp3" },
      { title: "Hati-Hati di Jalan", artist: "Tulus", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-22.mp3" },
    ],
  },
  {
    id: "Maul",
    name: "Maul",
    fullname: "Maulana",
    gender: "L",
    role: "MEMBER IN X RPL 1",
    birth: "18 Maret 2011",
    hobby: "Gaming, Coding",
    motto: "Resbob Mentality.",
    sosmed: { instagram: "https://instagram.com/iwengot" },
    songs: [
      { title: "Jangan Takut Melangkah", artist: "Cakra Khan", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-23.mp3" },
      { title: "Rewrite The Stars", artist: "OST The Greatest Showman", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-24.mp3" },
    ],
  },
  {
    id: "Raditya",
    name: "Radit",
    fullname: "Raditya Aprilio Coesar",
    gender: "L",
    role: "MEMBER IN X RPL 1",
    birth: "26 April 2011",
    hobby: "Menonton Film",
    motto: "Live fast, Die Young, Be wild have fun.",
    sosmed: { instagram: "https://instagram.com/rdtyprleo" },
    songs: [
      { title: "Malam Seputih Mawar", artist: "Hindia", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-25.mp3" },
      { title: "Bermain Dengan Hati", artist: "Fiersa Besari", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-26.mp3" },
    ],
  },
  {
    id: "Andanu",
    name: "Andanu",
    fullname: "Andanu Risyad Fadhillah",
    gender: "L",
    role: "MEMBER IN X RPL 1",
    sosmed: { instagram: "https://www.instagram.com/aandanuu15/" },
    songs: [
      { title: "Hati-Hati di Jalan", artist: "Tulus", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-27.mp3" },
      { title: "Laskar Pelangi", artist: "Nidji", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-28.mp3" },
    ],
  },
];
