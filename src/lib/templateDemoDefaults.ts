export interface DemoDataDefaults {
  hero: {
    headline: string;
    couple_names: string;
    opening_text: string;
    location: string;
    date: string;
    cover_image?: string;
    background_image?: string;
  };
  couple: {
    groom_name: string;
    groom_parents: string;
    groom_bio: string;
    groom_photo?: string;
    bride_name: string;
    bride_parents: string;
    bride_bio: string;
    bride_photo?: string;
    couple_photo?: string;
  };
  quote: {
    enabled: boolean;
    arabic?: string;
    quote_text: string;
    source: string;
  };
  events: Array<{
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string | null;
    timezone: string;
    venue_name: string;
    address: string;
    maps_url: string;
    is_primary: boolean;
  }>;
  story: Array<{
    id: string;
    title: string;
    year_date: string;
    description: string;
    display_order: number;
    is_enabled: boolean;
  }>;
  gallery: Array<{
    id: string;
    image_url: string;
    caption: string;
    display_order: number;
  }>;
  gift: {
    enabled: boolean;
    bank: string;
    account_number: string;
    account_name: string;
    accounts: Array<{
      id: string;
      type: 'bank' | 'ewallet';
      provider: string;
      account_number: string;
      holder_name: string;
      display_order: number;
      is_enabled: boolean;
    }>;
    physical_address: {
      recipient_name: string;
      address: string;
      is_enabled: boolean;
    };
  };
  rsvp: {
    enabled: boolean;
    headline: string;
    description: string;
  };
  wishes: {
    enabled: boolean;
    sample_wishes?: Array<{
      id: string;
      sender_name: string;
      message: string;
      attendance_status: string;
      created_at: string;
    }>;
  };
  closing: {
    closing_message: string;
    image?: string;
  };
  music?: {
    title: string;
    artist: string;
    audio_url: string;
  };
}

export const TEMPLATE_DEMO_DEFAULTS: Record<string, DemoDataDefaults> = {
  'royal-navy-gold': {
    hero: {
      headline: 'Walimatul Ursy',
      couple_names: 'Raka & Aulia',
      opening_text: 'Sabtu, 24 Oktober 2026',
      location: 'Grand Ballroom Hotel Aryaduta Bandung',
      date: '2026-10-24',
      cover_image: '/images/demo/royal-navy-gold/cover.jpg',
      background_image: '/images/demo/royal-navy-gold/cover.jpg',
    },
    couple: {
      groom_name: 'Raka Pratama, S.T.',
      groom_parents: 'Putra pertama dari Bpk. Ir. H. Hendra Pratama & Ibu Hj. Ratna Juwita',
      groom_bio: 'Putra pertama yang berdedikasi dan penuh kehangatan dalam membina keluarga.',
      groom_photo: '/images/demo/royal-navy-gold/groom.jpg',
      bride_name: 'Aulia Nurfadilah, S.Farm.',
      bride_parents: 'Putri bungsu dari Bpk. Drs. H. Achmad Fauzan & Ibu Hj. Dewi Sartika',
      bride_bio: 'Putri bungsu yang santun dan gemar menebarkan keceriaan bagi orang-orang terdekat.',
      bride_photo: '/images/demo/royal-navy-gold/bride.jpg',
      couple_photo: '/images/demo/royal-navy-gold/couple.jpg',
    },
    quote: {
      enabled: true,
      arabic: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
      quote_text: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
      source: 'QS. Ar-Rum: 21',
    },
    events: [
      {
        id: 'ev-1',
        title: 'Akad Nikah',
        date: '2026-10-24',
        start_time: '08:00',
        end_time: '10:00',
        timezone: 'WIB',
        venue_name: 'Masjid Agung Al-Ukhuwah Bandung',
        address: 'Jl. Wastukencana No. 27, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung',
        maps_url: 'https://maps.google.com/?q=Masjid+Agung+Al-Ukhuwah+Bandung',
        is_primary: false,
      },
      {
        id: 'ev-2',
        title: 'Resepsi Pernikahan',
        date: '2026-10-24',
        start_time: '11:00',
        end_time: '14:00',
        timezone: 'WIB',
        venue_name: 'Grand Ballroom Hotel Aryaduta Bandung',
        address: 'Jl. Sumatera No. 51, Citarum, Kec. Bandung Wetan, Kota Bandung',
        maps_url: 'https://maps.google.com/?q=Hotel+Aryaduta+Bandung',
        is_primary: true,
      },
    ],
    story: [
      {
        id: 'story-1',
        title: 'Awal Pertemuan',
        year_date: '2021',
        description: 'Pertama kali bertukar sapa di ruang seminar kampus, mengawali obrolan hangat tentang karya dan cita-cita masa depan.',
        display_order: 0,
        is_enabled: true,
      },
      {
        id: 'story-2',
        title: 'Komitmen Bersama',
        year_date: '2024',
        description: 'Dengan restu penuh kedua keluarga besar, kami membulatkan niat untuk melangkah bersama dalam ikatan suci yang penuh berkah.',
        display_order: 1,
        is_enabled: true,
      },
      {
        id: 'story-3',
        title: 'Menuju Hari Bahagia',
        year_date: '2026',
        description: 'Mempersiapkan hari istimewa kami dengan rasa syukur mendalam, menyambut keluarga dan sahabat tercinta.',
        display_order: 2,
        is_enabled: true,
      },
    ],
    gallery: [
      {
        id: 'photo-1',
        image_url: '/images/demo/royal-navy-gold/couple.jpg',
        caption: 'Senyuman hangat dalam balutan busana adat Jawa bernuansa navy emas.',
        display_order: 0,
      },
      {
        id: 'photo-2',
        image_url: '/images/demo/royal-navy-gold/gallery-1.jpg',
        caption: 'Saling memandang penuh ketulusan di pelataran pendopo agung.',
        display_order: 1,
      },
      {
        id: 'photo-3',
        image_url: '/images/demo/royal-navy-gold/gallery-2.jpg',
        caption: 'Menatap masa depan bersama dengan tekad yang bulat dan ikhlas.',
        display_order: 2,
      },
      {
        id: 'photo-4',
        image_url: '/images/demo/royal-navy-gold/closing.jpg',
        caption: 'Langkah beriringan menyongsong hari bahagia pernikahan suci.',
        display_order: 3,
      },
    ],
    gift: {
      enabled: true,
      bank: 'Bank Central Asia (BCA)',
      account_number: '7820194821',
      account_name: 'Raka Pratama',
      accounts: [
        {
          id: 'acc-1',
          type: 'bank',
          provider: 'Bank Central Asia (BCA)',
          account_number: '7820194821',
          holder_name: 'Raka Pratama',
          display_order: 0,
          is_enabled: true,
        },
        {
          id: 'acc-2',
          type: 'bank',
          provider: 'Bank Mandiri',
          account_number: '1310012398471',
          holder_name: 'Aulia Nurfadilah',
          display_order: 1,
          is_enabled: true,
        },
      ],
      physical_address: {
        recipient_name: 'Raka & Aulia',
        address: 'Jl. Riau No. 45, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115',
        is_enabled: true,
      },
    },
    rsvp: {
      enabled: true,
      headline: 'Konfirmasi Kehadiran Tamu',
      description: 'Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan mengonfirmasi kehadiran.',
    },
    wishes: {
      enabled: true,
      sample_wishes: [
        {
          id: 'w-1',
          sender_name: 'H. Hendra & Keluarga',
          message: 'Barakallahu lakuma wa baraka alaikuma wa jamaa bainakuma fii khair. Selamat menempuh hidup baru anakku.',
          attendance_status: 'attending',
          created_at: '2026-09-20T10:00:00Z',
        },
        {
          id: 'w-2',
          sender_name: 'Alif Kurniawan (Sahabat Kuliah)',
          message: 'Selamat Raka dan Aulia! Semoga selalu menjadi keluarga sakinah, mawaddah, warahmah selamanya.',
          attendance_status: 'attending',
          created_at: '2026-09-21T14:30:00Z',
        },
        {
          id: 'w-3',
          sender_name: 'Dr. Retno Wulandari',
          message: 'Turut berbahagia untuk kedua mempelai yang serasi. Doa terbaik dari kami sekeluarga.',
          attendance_status: 'attending',
          created_at: '2026-09-22T08:15:00Z',
        },
      ],
    },
    closing: {
      closing_message: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi lembaran baru kehidupan kami.',
      image: '/images/demo/royal-navy-gold/closing.jpg',
    },
  },
  'classic-elegance': {
    hero: {
      headline: 'The Wedding Celebration Of',
      couple_names: 'Sarah & Dimas',
      opening_text: 'Minggu, 20 September 2026',
      location: 'Gedung Arsip Nasional & Glass House, Jakarta',
      date: '2026-09-20',
      cover_image: '/images/demo/classic-elegance/cover.jpg',
      background_image: '/images/demo/classic-elegance/cover.jpg',
    },
    couple: {
      groom_name: 'Dimas Wicaksana, B.Eng.',
      groom_parents: 'Putra dari Bpk. Bambang Wicaksana & Ibu Ratna Utami',
      groom_bio: 'Sosok penuh kehangatan dan dedikasi dalam membangun masa depan bersama.',
      groom_photo: '/images/demo/classic-elegance/groom.jpg',
      bride_name: 'Sarah Larasati, M.Psi.',
      bride_parents: 'Putri dari Bpk. Priyanto Danusubroto & Ibu Endang Sulistyowati',
      bride_bio: 'Sosok anggun yang selalu membawa keceriaan dan kedamaian di setiap langkah.',
      bride_photo: '/images/demo/classic-elegance/bride.jpg',
      couple_photo: '/images/demo/classic-elegance/couple.jpg',
    },
    quote: {
      enabled: true,
      quote_text: 'Dua jiwa yang saling menemukan dalam ketulusan, bertumbuh dalam kebaikan, dan melangkah bersama dalam ikatan suci pernikahan yang abadi.',
      source: 'Kutipan Pengantin',
    },
    events: [
      {
        id: 'ev-1',
        title: 'Pemberkatan Pernikahan',
        date: '2026-09-20',
        start_time: '09:00',
        end_time: '11:00',
        timezone: 'WIB',
        venue_name: 'Gedung Arsip Nasional Jakarta',
        address: 'Jl. Gajah Mada No. 111, Krukut, Kec. Taman Sari, Kota Jakarta Barat',
        maps_url: 'https://maps.google.com/?q=Gedung+Arsip+Nasional+Jakarta',
        is_primary: false,
      },
      {
        id: 'ev-2',
        title: 'Resepsi Makan Malam',
        date: '2026-09-20',
        start_time: '18:30',
        end_time: '21:00',
        timezone: 'WIB',
        venue_name: 'Glass House Pavilion Jakarta',
        address: 'Jl. Wijaya II No. 42, Kebayoran Baru, Jakarta Selatan',
        maps_url: 'https://maps.google.com/?q=Glass+House+Jakarta',
        is_primary: true,
      },
    ],
    story: [
      {
        id: 'story-1',
        title: 'Pertemuan Pertama',
        year_date: '2020',
        description: 'Sebuah perjumpaan tak terduga di pameran seni rupa Jakarta, mengalir menjadi perbincangan mendalam tentang impian hidup.',
        display_order: 0,
        is_enabled: true,
      },
      {
        id: 'story-2',
        title: 'Menjalin Rasa',
        year_date: '2023',
        description: 'Tahun-tahun penuh tawa, saling mendukung karier dan keluarga, hingga meyakini bahwa kami ditakdirkan bersama.',
        display_order: 1,
        is_enabled: true,
      },
      {
        id: 'story-3',
        title: 'Lamaran & Janji Suci',
        year_date: '2026',
        description: 'Di hadapan kedua keluarga besar tercinta, kami membulatkan niat mengikat janji suci seumur hidup.',
        display_order: 2,
        is_enabled: true,
      },
    ],
    gallery: [
      {
        id: 'photo-1',
        image_url: '/images/demo/classic-elegance/couple.jpg',
        caption: 'Potret editorial anggun dalam balutan gaun champagne dan tuksedo hitam klasik.',
        display_order: 0,
      },
      {
        id: 'photo-2',
        image_url: '/images/demo/classic-elegance/gallery-1.jpg',
        caption: 'Momen bahagia saling bertukar senyum di pelataran manor bernuansa vintage.',
        display_order: 1,
      },
      {
        id: 'photo-3',
        image_url: '/images/demo/classic-elegance/gallery-2.jpg',
        caption: 'Dua insan yang siap mengarungi bahtera kehidupan bersama selamanya.',
        display_order: 2,
      },
      {
        id: 'photo-4',
        image_url: '/images/demo/classic-elegance/closing.jpg',
        caption: 'Tatapan penuh ketulusan menjelang ikrar suci hari bahagia.',
        display_order: 3,
      },
    ],
    gift: {
      enabled: true,
      bank: 'Bank Central Asia (BCA)',
      account_number: '5271928391',
      account_name: 'Sarah Larasati',
      accounts: [
        {
          id: 'acc-1',
          type: 'bank',
          provider: 'Bank Central Asia (BCA)',
          account_number: '5271928391',
          holder_name: 'Sarah Larasati',
          display_order: 0,
          is_enabled: true,
        },
        {
          id: 'acc-2',
          type: 'bank',
          provider: 'Bank Mandiri',
          account_number: '1220098765432',
          holder_name: 'Dimas Wicaksana',
          display_order: 1,
          is_enabled: true,
        },
      ],
      physical_address: {
        recipient_name: 'Sarah & Dimas',
        address: 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190',
        is_enabled: true,
      },
    },
    rsvp: {
      enabled: true,
      headline: 'Konfirmasi Kehadiran',
      description: 'Harap konfirmasi kehadiran Anda demi kelancaran jamuan resepsi.',
    },
    wishes: {
      enabled: true,
      sample_wishes: [
        {
          id: 'w-1',
          sender_name: 'Clara & Kevin',
          message: 'Warmest congratulations to Sarah and Dimas! Wishing you a lifetime of love and happiness.',
          attendance_status: 'attending',
          created_at: '2026-09-18T11:00:00Z',
        },
        {
          id: 'w-2',
          sender_name: 'Om Bambang & Tante Sri',
          message: 'Selamat untuk Sarah & Dimas. Semoga rukun selalu dan diberkahi kebahagiaan hingga anak cucu.',
          attendance_status: 'attending',
          created_at: '2026-09-19T15:20:00Z',
        },
      ],
    },
    closing: {
      closing_message: 'Doa restu dan kehadiran Anda adalah anugerah terindah bagi lembaran baru rumah tangga kami.',
      image: '/images/demo/classic-elegance/closing.jpg',
    },
  },
  'botanical-garden': {
    hero: {
      headline: 'The Wedding Of',
      couple_names: 'Amira & Fajar',
      opening_text: 'Minggu, 12 Desember 2026',
      location: 'Pine Hill Botanical Garden, Lembang, Bandung',
      date: '2026-12-12',
      cover_image: '/images/demo/botanical-garden/cover.jpg',
      background_image: '/images/demo/botanical-garden/cover.jpg',
    },
    couple: {
      groom_name: 'Fajar Ramadhan, S.Ds.',
      groom_parents: 'Putra kedua dari Bpk. H. Rahmat Hidayat & Ibu Hj. Siti Munawaroh',
      groom_bio: 'Desainer kreatif yang mencintai alam dan berjiwa hangat.',
      groom_photo: '/images/demo/botanical-garden/groom.jpg',
      bride_name: 'Amira Nadhira, S.I.Kom.',
      bride_parents: 'Putri pertama dari Bpk. Ir. H. Syarifuddin & Ibu Hj. Linda Marlina',
      bride_bio: 'Sosok penyayang dan gemar menebarkan energi positif di manapun berada.',
      bride_photo: '/images/demo/botanical-garden/bride.jpg',
      couple_photo: '/images/demo/botanical-garden/couple.jpg',
    },
    quote: {
      enabled: true,
      quote_text: 'Mencintai bukanlah saling menatap satu sama lain, melainkan memandang bersama ke arah yang sama dengan harapan yang bersemi indah.',
      source: 'Untaian Doa Kebun',
    },
    events: [
      {
        id: 'ev-1',
        title: 'Akad Nikah Luar Ruangan',
        date: '2026-12-12',
        start_time: '08:30',
        end_time: '10:30',
        timezone: 'WIB',
        venue_name: 'Pine Hill Botanical Garden',
        address: 'Jl. Maribaya Timur, Desa Cibodas, Kec. Lembang, Kabupaten Bandung Barat',
        maps_url: 'https://maps.google.com/?q=Pine+Hill+Cibodas+Lembang',
        is_primary: false,
      },
      {
        id: 'ev-2',
        title: 'Resepsi Botanical Sunset',
        date: '2026-12-12',
        start_time: '11:30',
        end_time: '15:00',
        timezone: 'WIB',
        venue_name: 'Greenhouse Pavilion Pine Hill',
        address: 'Jl. Maribaya Timur, Desa Cibodas, Kec. Lembang, Kabupaten Bandung Barat',
        maps_url: 'https://maps.google.com/?q=Pine+Hill+Cibodas+Lembang',
        is_primary: true,
      },
    ],
    story: [
      {
        id: 'story-1',
        title: 'Kisah di Bawah Rindang Pinus',
        year_date: '2022',
        description: 'Bermula dari kegiatan konservasi alam bersama, tumbuh kecocokan hati yang menyejukkan.',
        display_order: 0,
        is_enabled: true,
      },
      {
        id: 'story-2',
        title: 'Tumbuh Bersama',
        year_date: '2024',
        description: 'Saling menyirami dengan pengertian, bertumbuh bagai tunas hijau yang kian kokoh.',
        display_order: 1,
        is_enabled: true,
      },
      {
        id: 'story-3',
        title: 'Bersemi Selamanya',
        year_date: '2026',
        description: 'Memilih hari terindah untuk saling mengikat janji suci di hadapan alam dan keluarga besar.',
        display_order: 2,
        is_enabled: true,
      },
    ],
    gallery: [
      {
        id: 'photo-1',
        image_url: '/images/demo/botanical-garden/couple.jpg',
        caption: 'Genggaman tangan erat di dalam rumah kaca hijau dipenuhi wangi anggrek putih.',
        display_order: 0,
      },
      {
        id: 'photo-2',
        image_url: '/images/demo/botanical-garden/gallery-1.jpg',
        caption: 'Senyum bahagia di antara rimbun dedaunan monstera dan semilir angin pegunungan.',
        display_order: 1,
      },
      {
        id: 'photo-3',
        image_url: '/images/demo/botanical-garden/gallery-2.jpg',
        caption: 'Saling tersenyum hangat menyambut babak baru kehidupan bersama.',
        display_order: 2,
      },
      {
        id: 'photo-4',
        image_url: '/images/demo/botanical-garden/closing.jpg',
        caption: 'Momen teduh di pelataran kebun pinus yang asri.',
        display_order: 3,
      },
    ],
    gift: {
      enabled: true,
      bank: 'Bank Negara Indonesia (BNI)',
      account_number: '0829182391',
      account_name: 'Fajar Ramadhan',
      accounts: [
        {
          id: 'acc-1',
          type: 'bank',
          provider: 'Bank Negara Indonesia (BNI)',
          account_number: '0829182391',
          holder_name: 'Fajar Ramadhan',
          display_order: 0,
          is_enabled: true,
        },
        {
          id: 'acc-2',
          type: 'bank',
          provider: 'Bank Central Asia (BCA)',
          account_number: '8472910391',
          holder_name: 'Amira Nadhira',
          display_order: 1,
          is_enabled: true,
        },
      ],
      physical_address: {
        recipient_name: 'Amira & Fajar',
        address: 'Jl. Dago Giri No. 12, Lembang, Bandung 40391',
        is_enabled: true,
      },
    },
    rsvp: {
      enabled: true,
      headline: 'Konfirmasi Kehadiran Tamu',
      description: 'Mohon konfirmasikan kehadiran Anda agar kami dapat menyiapkan jamuan terbaik di kebun.',
    },
    wishes: {
      enabled: true,
      sample_wishes: [
        {
          id: 'w-1',
          sender_name: 'Nisa & Rizky',
          message: 'Happy wedding Amira & Fajar! Semoga cinta kalian selalu bersemi dan saling membahagiakan selamanya.',
          attendance_status: 'attending',
          created_at: '2026-12-01T09:00:00Z',
        },
        {
          id: 'w-2',
          sender_name: 'Komunitas Alam Lestari',
          message: 'Selamat menempuh babak baru! Semoga selalu harmonis dan penuh cinta.',
          attendance_status: 'attending',
          created_at: '2026-12-02T16:45:00Z',
        },
      ],
    },
    closing: {
      closing_message: 'Terima kasih atas segenap doa restu yang mengalir tulus mengiringi hari bahagia kami.',
      image: '/images/demo/botanical-garden/closing.jpg',
    },
  },
  'modern-minimal': {
    hero: {
      headline: 'Modern Union',
      couple_names: 'Nadia & Reza',
      opening_text: 'Sabtu, 08 November 2026',
      location: 'The Dharmawangsa Gallery & Glass Terrace, Jakarta',
      date: '2026-11-08',
      cover_image: '/images/demo/modern-minimal/cover.jpg',
      background_image: '/images/demo/modern-minimal/cover.jpg',
    },
    couple: {
      groom_name: 'Reza Mahendra, B.Sc.',
      groom_parents: 'Putra dari Bpk. Gunawan Mahendra & Ibu Rini Puspitasari',
      groom_bio: 'Profesional muda yang menghargai ketelitian, kejelasan, dan ketulusan komitmen.',
      groom_photo: '/images/demo/modern-minimal/groom.jpg',
      bride_name: 'Nadia Safitri, B.A.',
      bride_parents: 'Putri dari Bpk. Kuntoro Adji & Ibu Maya Indrawati',
      bride_bio: 'Sosok elegan dan berwawasan luas yang senantiasa membawa keharmonisan.',
      bride_photo: '/images/demo/modern-minimal/bride.jpg',
      couple_photo: '/images/demo/modern-minimal/couple.jpg',
    },
    quote: {
      enabled: true,
      quote_text: 'Kesederhanaan yang menyingkap keindahan sejati: rasa cinta yang tenang, kokoh, dan berkesinambungan selamanya.',
      source: 'Pernyataan Janji',
    },
    events: [
      {
        id: 'ev-1',
        title: 'Holy Matrimony & Akad',
        date: '2026-11-08',
        start_time: '10:00',
        end_time: '11:30',
        timezone: 'WIB',
        venue_name: 'The Contemporary Hall Dharmawangsa',
        address: 'Jl. Brawijaya Raya No. 26, Kebayoran Baru, Jakarta Selatan',
        maps_url: 'https://maps.google.com/?q=The+Dharmawangsa+Jakarta',
        is_primary: false,
      },
      {
        id: 'ev-2',
        title: 'Cocktail & Evening Reception',
        date: '2026-11-08',
        start_time: '19:00',
        end_time: '22:00',
        timezone: 'WIB',
        venue_name: 'The Glass Terrace Dharmawangsa',
        address: 'Jl. Brawijaya Raya No. 26, Kebayoran Baru, Jakarta Selatan',
        maps_url: 'https://maps.google.com/?q=The+Dharmawangsa+Jakarta',
        is_primary: true,
      },
    ],
    story: [
      {
        id: 'story-1',
        title: 'Pertemuan Pertama',
        year_date: '2022',
        description: 'Bertemu di sebuah pameran arsitektur modern, berawal dari pandangan yang sama mengenai estetika ruang dan waktu.',
        display_order: 0,
        is_enabled: true,
      },
      {
        id: 'story-2',
        title: 'Komitmen Tanpa Keraguan',
        year_date: '2025',
        description: 'Dalam kesederhanaan yang bermakna, kami sepakat menyatukan visi hidup dalam satu langkah pasti.',
        display_order: 1,
        is_enabled: true,
      },
      {
        id: 'story-3',
        title: 'Satu Lembaran Baru',
        year_date: '2026',
        description: 'Menyambut perayaan pernikahan bersama orang-orang terdekat dengan penuh keintiman dan syukur.',
        display_order: 2,
        is_enabled: true,
      },
    ],
    gallery: [
      {
        id: 'photo-1',
        image_url: '/images/demo/modern-minimal/couple.jpg',
        caption: 'Potret kontemporer dengan aksen dark teal di dalam galeri seni modern.',
        display_order: 0,
      },
      {
        id: 'photo-2',
        image_url: '/images/demo/modern-minimal/gallery-1.jpg',
        caption: 'Elegan dalam garis rancang arsitektural yang bersih dan bersahaja.',
        display_order: 1,
      },
      {
        id: 'photo-3',
        image_url: '/images/demo/modern-minimal/gallery-2.jpg',
        caption: 'Saling bergandengan tangan menatap masa depan yang cerah.',
        display_order: 2,
      },
      {
        id: 'photo-4',
        image_url: '/images/demo/modern-minimal/closing.jpg',
        caption: 'Momen intim perayaan cinta dalam nuansa modern minimalis.',
        display_order: 3,
      },
    ],
    gift: {
      enabled: true,
      bank: 'Bank Central Asia (BCA)',
      account_number: '7310298412',
      account_name: 'Reza Mahendra',
      accounts: [
        {
          id: 'acc-1',
          type: 'bank',
          provider: 'Bank Central Asia (BCA)',
          account_number: '7310298412',
          holder_name: 'Reza Mahendra',
          display_order: 0,
          is_enabled: true,
        },
        {
          id: 'acc-2',
          type: 'bank',
          provider: 'Bank Jago / Jenius',
          account_number: '50010928391',
          holder_name: 'Nadia Safitri',
          display_order: 1,
          is_enabled: true,
        },
      ],
      physical_address: {
        recipient_name: 'Nadia & Reza',
        address: 'Jl. Bumi No. 19, Kebayoran Baru, Jakarta Selatan 12120',
        is_enabled: true,
      },
    },
    rsvp: {
      enabled: true,
      headline: 'Konfirmasi Kehadiran',
      description: 'Mohon kesediaan konfirmasi kehadiran Anda sebelum tanggal 01 November 2026.',
    },
    wishes: {
      enabled: true,
      sample_wishes: [
        {
          id: 'w-1',
          sender_name: 'Adrian & Maya',
          message: 'Congratulations Reza & Nadia! Beautiful modern union. Wishing both of you great adventures ahead.',
          attendance_status: 'attending',
          created_at: '2026-11-01T12:00:00Z',
        },
        {
          id: 'w-2',
          sender_name: 'Tania Arifin',
          message: 'So happy for both of you! Selamat merayakan cinta yang tulus dan menginspirasi.',
          attendance_status: 'attending',
          created_at: '2026-11-02T18:10:00Z',
        },
      ],
    },
    closing: {
      closing_message: 'Kehadiran dan doa restu Anda melengkapi kebahagiaan sejati langkah awal kami berdua.',
      image: '/images/demo/modern-minimal/closing.jpg',
    },
  },
};

export function getTemplateDemoDefaults(slug: string): DemoDataDefaults {
  return TEMPLATE_DEMO_DEFAULTS[slug] || TEMPLATE_DEMO_DEFAULTS['classic-elegance']!;
}
