import { useEffect, useState, useCallback, useMemo, useRef, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getMyInvitationById,
  updateInvitationCore,
  deleteMyInvitation,
  publishInvitation,
  unpublishInvitation,
  getInvitationTemplateConfig,
  getInvitationData,
  upsertInvitationData,
  initializeInvitationSectionsFromTemplate,
  updateInvitationSections,
  getInvitationEvents,
  createInvitationEvent,
  updateInvitationEvent,
  deleteInvitationEvent,
  getInvitationGalleryItems,
  updateInvitationGalleryItem,
  updateGalleryItemsOrder,
  uploadInvitationGalleryPhoto,
  deleteInvitationGalleryPhoto,
  uploadCouplePhoto,
  deleteGalleryImageFile,
  getGalleryPublicUrl,
  validateGalleryImageFile,
  type InvitationDetail as IInvitationDetail,
  type InvitationTemplateConfig,
  type InvitationSectionItem,
  type InvitationEventItem,
  type InvitationGalleryItem,
} from '@/lib/invitations';
import type {
  InvitationContent,
  InvitationContentStoryItem,
  InvitationContentHost,
  InvitationContentGiftAccount,
  InvitationContentGiftAddress,
  InvitationContentMusic,
  InvitationContentCover,
} from '@/lib/template/types';
import {
  isValidAudioUrl,
  validateMusicConfig,
  sanitizeMusicConfig,
  DEFAULT_MUSIC_CONFIG,
} from '@/lib/music';
import {
  DEFAULT_COVER_CONFIG,
  validateCoverConfig,
  sanitizeCoverConfig,
} from '@/lib/cover';
import { isValidWebUrl } from '@/lib/urls';
import { getInvitationGuests } from '@/lib/guests';
import { GuestManagementTab } from '@/components/dashboard/GuestManagementTab';
import { InvitationRenderer } from '@/components/template';
import { ValidationError, DatabaseError, AuthorizationError } from '@/lib/errors';

/**
 * Metadata seksi untuk tampilan pengelolaan tata letak editor
 */
const SECTION_METADATA: Record<string, { label: string; description: string }> = {
  hero: { label: 'Sampul Utama (Hero Cover)', description: 'Header pembuka dengan judul acara dan tanggal' },
  hosts: { label: 'Profil Mempelai (Couple)', description: 'Informasi calon mempelai pria dan wanita' },
  couple: { label: 'Profil Mempelai (Couple)', description: 'Informasi calon mempelai pria dan wanita' },
  events: { label: 'Agenda Acara (Events)', description: 'Waktu pelaksanaan, lokasi gedung, dan peta' },
  event: { label: 'Agenda Acara (Events)', description: 'Waktu pelaksanaan, lokasi gedung, dan peta' },
  story: { label: 'Kisah Cinta (Story)', description: 'Linimasa perjalanan cinta kedua mempelai' },
  gallery: { label: 'Galeri Foto (Gallery)', description: 'Dokumentasi foto momen kebahagiaan' },
  rsvp: { label: 'Konfirmasi Kehadiran (RSVP)', description: 'Formulir kepastian kehadiran tamu undangan' },
  wishes: { label: 'Buku Ucapan & Doa (Wishes)', description: 'Untaian doa dan ucapan hangat dari kerabat' },
  gift: { label: 'Tanda Kasih (Gift)', description: 'Nomor rekening atau amplop digital' },
  closing: { label: 'Penutup & Salam (Closing)', description: 'Kutipan ayat dan ucapan terima kasih' },
};

/**
 * Konversi ISO timestamp ke format input datetime-local (YYYY-MM-DDTHH:mm)
 */
function toDatetimeLocal(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function InvitationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Status dasar halaman
  const [invitation, setInvitation] = useState<IInvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Template config untuk preview
  const [previewConfig, setPreviewConfig] = useState<InvitationTemplateConfig | null>(null);

  // Snapshot data tersimpan di database untuk deteksi perubahan
  const [savedSnapshot, setSavedSnapshot] = useState({
    title: '',
    slug: '',
    eventType: 'wedding',
    allowRsvp: true,
    showWishes: true,
    rsvpTitle: '',
    rsvpDescription: '',
    rsvpMaxPax: 5,
    rsvpAllowTentative: true,
    rsvpAllowNotes: true,
    heroHeadline: '',
    heroOpeningText: '',
    heroCoupleNames: '',
    heroLocation: '',
    groomName: '',
    groomRole: 'Mempelai Pria',
    groomParents: '',
    groomBio: '',
    groomPhotoUrl: '',
    groomStoragePath: '',
    brideName: '',
    brideRole: 'Mempelai Wanita',
    brideParents: '',
    brideBio: '',
    bridePhotoUrl: '',
    brideStoragePath: '',
    storyJson: '[]',
    closingNotes: '',
    sectionsJson: '',
    giftEnabled: true,
    giftTitle: 'Kirim Hadiah',
    giftDescription:
      'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda hendak memberikan tanda kasih, Anda dapat menyalurkannya melalui:',
    giftAccountsJson: '[]',
    giftAddressJson: JSON.stringify({
      recipient_name: '',
      address: '',
      phone: '',
      notes: '',
      is_enabled: false,
    }),
    musicJson: JSON.stringify(DEFAULT_MUSIC_CONFIG),
    coverJson: JSON.stringify(DEFAULT_COVER_CONFIG),
  });

  // State Formulir Sampul Pembuka (Cover Envelope)
  const [draftCover, setDraftCover] = useState<InvitationContentCover>({
    ...DEFAULT_COVER_CONFIG,
  });
  const [coverPreviewResetKey, setCoverPreviewResetKey] = useState(0);

  // State Formulir Pengaturan Umum (General Settings)
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSlug, setDraftSlug] = useState('');
  const [draftEventType, setDraftEventType] = useState('wedding');
  const [draftAllowRsvp, setDraftAllowRsvp] = useState(true);
  const [draftShowWishes, setDraftShowWishes] = useState(true);

  // State Pengaturan RSVP Kustom
  const [draftRsvpTitle, setDraftRsvpTitle] = useState('');
  const [draftRsvpDescription, setDraftRsvpDescription] = useState('');
  const [draftRsvpMaxPax, setDraftRsvpMaxPax] = useState(5);
  const [draftRsvpAllowTentative, setDraftRsvpAllowTentative] = useState(true);
  const [draftRsvpAllowNotes, setDraftRsvpAllowNotes] = useState(true);

  // State Hero / Cover (Hero Content)
  const [draftHeroHeadline, setDraftHeroHeadline] = useState('');
  const [draftHeroOpeningText, setDraftHeroOpeningText] = useState('');
  const [draftHeroCoupleNames, setDraftHeroCoupleNames] = useState('');
  const [draftHeroLocation, setDraftHeroLocation] = useState('');

  // State Formulir Konten Mempelai (Couple & Hosts)
  const [draftGroomName, setDraftGroomName] = useState('');
  const [draftGroomRole, setDraftGroomRole] = useState('Mempelai Pria');
  const [draftGroomParents, setDraftGroomParents] = useState('');
  const [draftGroomBio, setDraftGroomBio] = useState('');
  const [draftGroomPhotoUrl, setDraftGroomPhotoUrl] = useState('');
  const [draftGroomStoragePath, setDraftGroomStoragePath] = useState('');
  const [isUploadingGroomPhoto, setIsUploadingGroomPhoto] = useState(false);
  const [groomPhotoError, setGroomPhotoError] = useState<string | null>(null);
  const groomFileInputRef = useRef<HTMLInputElement>(null);

  const [draftBrideName, setDraftBrideName] = useState('');
  const [draftBrideRole, setDraftBrideRole] = useState('Mempelai Wanita');
  const [draftBrideParents, setDraftBrideParents] = useState('');
  const [draftBrideBio, setDraftBrideBio] = useState('');
  const [draftBridePhotoUrl, setDraftBridePhotoUrl] = useState('');
  const [draftBrideStoragePath, setDraftBrideStoragePath] = useState('');
  const [isUploadingBridePhoto, setIsUploadingBridePhoto] = useState(false);
  const [bridePhotoError, setBridePhotoError] = useState<string | null>(null);
  const brideFileInputRef = useRef<HTMLInputElement>(null);

  const [draftClosingNotes, setDraftClosingNotes] = useState('');

  // State Linimasa Cerita Cinta (Story)
  const [draftStory, setDraftStory] = useState<InvitationContentStoryItem[]>([]);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [storyForm, setStoryForm] = useState({ title: '', date: '', description: '' });
  const [storyErrorMessage, setStoryErrorMessage] = useState<string | null>(null);
  const [deleteStoryModalOpen, setDeleteStoryModalOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<InvitationContentStoryItem | null>(null);

  // State Seksi Undangan (invitation_sections)
  const [draftSections, setDraftSections] = useState<InvitationSectionItem[]>([]);

  // State Agenda Acara (events)
  const [draftEvents, setDraftEvents] = useState<InvitationEventItem[]>([]);

  // State Galeri Foto (gallery_items)
  const [draftGallery, setDraftGallery] = useState<InvitationGalleryItem[]>([]);

  // State Pengaturan Hadiah & Amplop Digital (Gift)
  const [draftGiftEnabled, setDraftGiftEnabled] = useState(true);
  const [draftGiftTitle, setDraftGiftTitle] = useState('Kirim Hadiah');
  const [draftGiftDescription, setDraftGiftDescription] = useState(
    'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda hendak memberikan tanda kasih, Anda dapat menyalurkannya melalui:'
  );
  const [draftGiftAccounts, setDraftGiftAccounts] = useState<InvitationContentGiftAccount[]>([]);
  const [draftGiftAddress, setDraftGiftAddress] = useState<InvitationContentGiftAddress>({
    recipient_name: '',
    address: '',
    phone: '',
    notes: '',
    is_enabled: false,
  });

  // Modal Tambah / Edit Rekening & E-Wallet
  const [giftAccountModalOpen, setGiftAccountModalOpen] = useState(false);
  const [editingGiftAccountId, setEditingGiftAccountId] = useState<string | null>(null);
  const [giftAccountForm, setGiftAccountForm] = useState<{
    type: 'bank' | 'ewallet';
    provider: string;
    account_number: string;
    holder_name: string;
    label: string;
    is_enabled: boolean;
  }>({
    type: 'bank',
    provider: '',
    account_number: '',
    holder_name: '',
    label: '',
    is_enabled: true,
  });
  const [giftAccountError, setGiftAccountError] = useState<string | null>(null);

  // Modal Konfirmasi Hapus Rekening Gift
  const [deleteGiftAccountModalOpen, setDeleteGiftAccountModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<InvitationContentGiftAccount | null>(null);

  // State Pengaturan Musik Latar (Music)
  const [draftMusic, setDraftMusic] = useState<InvitationContentMusic>({
    ...DEFAULT_MUSIC_CONFIG,
  });
  const [musicPreviewPlaying, setMusicPreviewPlaying] = useState(false);
  const [musicPreviewAudio, setMusicPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [musicPreviewError, setMusicPreviewError] = useState<string | null>(null);

  // Tampilan antarmuka
  const [activeTab, setActiveTab] = useState<
    'settings' | 'cover' | 'hero' | 'content' | 'story' | 'events' | 'gallery' | 'gift' | 'music' | 'sections' | 'guests'
  >('settings');
  const [guestCount, setGuestCount] = useState(0);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [showPreviewDesktop, setShowPreviewDesktop] = useState(true);

  // Status proses penyimpanan
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Modal Agenda Acara (Event Modal)
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
    timezone: 'Asia/Jakarta',
    venue_name: '',
    address: '',
    maps_url: '',
    is_primary: false,
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventErrorMessage, setEventErrorMessage] = useState<string | null>(null);

  // Modal Konfirmasi Hapus Acara
  const [deleteEventModalOpen, setDeleteEventModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<InvitationEventItem | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Modal Unggah Foto Galeri (Upload Modal)
  interface StagedUploadFile {
    id: string;
    file: File;
    previewUrl: string;
    caption: string;
    sizeFormatted: string;
  }
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedUploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Modal Edit Keterangan Foto
  const [editGalleryModalOpen, setEditGalleryModalOpen] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<InvitationGalleryItem | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isSavingEditGallery, setIsSavingEditGallery] = useState(false);
  const [editGalleryErrorMessage, setEditGalleryErrorMessage] = useState<string | null>(null);

  // Modal Konfirmasi Hapus Foto Galeri
  const [deleteGalleryModalOpen, setDeleteGalleryModalOpen] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState<InvitationGalleryItem | null>(null);
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);
  const [deleteGalleryErrorMessage, setDeleteGalleryErrorMessage] = useState<string | null>(null);

  // Status publikasi
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishSuccessModalOpen, setPublishSuccessModalOpen] = useState(false);
  const [publishValidationErrors, setPublishValidationErrors] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  // Status pembatalan publikasi (unpublish)
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);
  const [unpublishError, setUnpublishError] = useState<string | null>(null);

  // Status penghapusan undangan
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Muat data undangan, konten, seksi, acara, dan galeri
  const loadData = useCallback(async () => {
    if (!id) {
      setPageError('ID undangan tidak ditemukan.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const invData = await getMyInvitationById(id);
      if (!invData) {
        setPageError('Undangan tidak ditemukan atau Anda tidak memiliki hak akses ke data ini.');
        setLoading(false);
        return;
      }

      setInvitation(invData);

      // Inisialisasi state pengaturan umum
      const initialTitle = invData.title || '';
      const initialSlug = invData.slug || '';
      const initialEventType = invData.event_type || 'wedding';
      const initialAllowRsvp = Boolean(invData.allow_rsvp);
      const initialShowWishes = Boolean(invData.show_wishes);

      setDraftTitle(initialTitle);
      setDraftSlug(initialSlug);
      setDraftEventType(initialEventType);
      setDraftAllowRsvp(initialAllowRsvp);
      setDraftShowWishes(initialShowWishes);

      // Muat data konten mempelai, hero, dan cerita (invitation_data)
      const contentRecord = await getInvitationData(id);
      let initialHeroHeadline = '';
      let initialHeroOpeningText = '';
      let initialHeroCoupleNames = '';
      let initialHeroLocation = '';

      let initialGroomName = '';
      let initialGroomRole = 'Mempelai Pria';
      let initialGroomParents = '';
      let initialGroomBio = '';
      let initialGroomPhotoUrl = '';
      let initialGroomStoragePath = '';

      let initialBrideName = '';
      let initialBrideRole = 'Mempelai Wanita';
      let initialBrideParents = '';
      let initialBrideBio = '';
      let initialBridePhotoUrl = '';
      let initialBrideStoragePath = '';

      let initialStory: InvitationContentStoryItem[] = [];
      let initialClosingNotes = '';

      let initialRsvpTitle = '';
      let initialRsvpDescription = '';
      let initialRsvpMaxPax = 5;
      let initialRsvpAllowTentative = true;
      let initialRsvpAllowNotes = true;

      let initialGiftEnabled = true;
      let initialGiftTitle = 'Kirim Hadiah';
      let initialGiftDescription =
        'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda hendak memberikan tanda kasih, Anda dapat menyalurkannya melalui:';
      let initialGiftAccounts: InvitationContentGiftAccount[] = [];
      let initialGiftAddress: InvitationContentGiftAddress = {
        recipient_name: '',
        address: '',
        phone: '',
        notes: '',
        is_enabled: false,
      };
      let initialMusic: InvitationContentMusic = { ...DEFAULT_MUSIC_CONFIG };
      let initialCover: InvitationContentCover = { ...DEFAULT_COVER_CONFIG };

      if (contentRecord?.content) {
        const c = contentRecord.content;
        if (c.hero) {
          initialHeroHeadline = typeof c.hero.headline === 'string' ? c.hero.headline : '';
          initialHeroOpeningText = typeof c.hero.opening_text === 'string' ? c.hero.opening_text : '';
          initialHeroCoupleNames = typeof c.hero.couple_names === 'string' ? c.hero.couple_names : '';
          initialHeroLocation = typeof c.hero.location_short === 'string' ? c.hero.location_short : '';
        }

        const hosts = Array.isArray(c.hosts) ? c.hosts : [];
        if (hosts[0]) {
          initialGroomName = typeof hosts[0].name === 'string' ? hosts[0].name : '';
          initialGroomRole = typeof hosts[0].role === 'string' ? hosts[0].role : 'Mempelai Pria';
          initialGroomParents = typeof hosts[0].parents === 'string' ? hosts[0].parents : '';
          initialGroomBio = typeof hosts[0].bio === 'string' ? hosts[0].bio : '';
          initialGroomPhotoUrl = typeof hosts[0].photo_url === 'string' ? hosts[0].photo_url : '';
          initialGroomStoragePath = typeof hosts[0].storage_path === 'string' ? hosts[0].storage_path : '';
        }
        if (hosts[1]) {
          initialBrideName = typeof hosts[1].name === 'string' ? hosts[1].name : '';
          initialBrideRole = typeof hosts[1].role === 'string' ? hosts[1].role : 'Mempelai Wanita';
          initialBrideParents = typeof hosts[1].parents === 'string' ? hosts[1].parents : '';
          initialBrideBio = typeof hosts[1].bio === 'string' ? hosts[1].bio : '';
          initialBridePhotoUrl = typeof hosts[1].photo_url === 'string' ? hosts[1].photo_url : '';
          initialBrideStoragePath = typeof hosts[1].storage_path === 'string' ? hosts[1].storage_path : '';
        }

        if (Array.isArray(c.story)) {
          initialStory = c.story.map((st, idx) => ({
            id: typeof st.id === 'string' ? st.id : `story-${idx}`,
            title: typeof st.title === 'string' ? st.title : '',
            date: typeof st.date === 'string' ? st.date : undefined,
            description: typeof st.description === 'string' ? st.description : '',
            display_order: typeof st.display_order === 'number' ? st.display_order : idx,
            is_enabled: st.is_enabled !== false,
          }));
        }

        initialClosingNotes = typeof c.closing_notes === 'string' ? c.closing_notes : '';

        if (c.rsvp) {
          initialRsvpTitle = typeof c.rsvp.title === 'string' ? c.rsvp.title : '';
          initialRsvpDescription = typeof c.rsvp.description === 'string' ? c.rsvp.description : '';
          initialRsvpMaxPax = typeof c.rsvp.max_pax_default === 'number' ? c.rsvp.max_pax_default : 5;
          initialRsvpAllowTentative = c.rsvp.allow_tentative !== false;
          initialRsvpAllowNotes = c.rsvp.allow_notes !== false;
        }

        if (c.gift) {
          initialGiftEnabled = c.gift.is_enabled !== false;
          if (typeof c.gift.title === 'string') initialGiftTitle = c.gift.title;
          if (typeof c.gift.description === 'string') initialGiftDescription = c.gift.description;
          if (Array.isArray(c.gift.accounts)) {
            initialGiftAccounts = c.gift.accounts;
          }
          if (c.gift.physical_address) {
            initialGiftAddress = {
              recipient_name:
                typeof c.gift.physical_address.recipient_name === 'string'
                  ? c.gift.physical_address.recipient_name
                  : '',
              address:
                typeof c.gift.physical_address.address === 'string'
                  ? c.gift.physical_address.address
                  : '',
              phone:
                typeof c.gift.physical_address.phone === 'string'
                  ? c.gift.physical_address.phone
                  : '',
              notes:
                typeof c.gift.physical_address.notes === 'string'
                  ? c.gift.physical_address.notes
                  : '',
              is_enabled: Boolean(c.gift.physical_address.is_enabled),
            };
          }
        } else if (Array.isArray(c.financial_accounts)) {
          initialGiftAccounts = c.financial_accounts.map((acc, idx) => ({
            id: `legacy-${idx}`,
            type: 'bank' as const,
            provider: acc.bank_name || 'Bank Transfer',
            account_number: acc.account_number || '',
            holder_name: acc.holder_name || '',
            display_order: idx,
            is_enabled: true,
          }));
        }

        if (c.music) {
          initialMusic = sanitizeMusicConfig(c.music);
        }

        if (c.cover) {
          initialCover = sanitizeCoverConfig(c.cover);
        }
      }

      setDraftHeroHeadline(initialHeroHeadline);
      setDraftHeroOpeningText(initialHeroOpeningText);
      setDraftHeroCoupleNames(initialHeroCoupleNames);
      setDraftHeroLocation(initialHeroLocation);

      setDraftGroomName(initialGroomName);
      setDraftGroomRole(initialGroomRole);
      setDraftGroomParents(initialGroomParents);
      setDraftGroomBio(initialGroomBio);
      setDraftGroomPhotoUrl(initialGroomPhotoUrl);
      setDraftGroomStoragePath(initialGroomStoragePath);

      setDraftBrideName(initialBrideName);
      setDraftBrideRole(initialBrideRole);
      setDraftBrideParents(initialBrideParents);
      setDraftBrideBio(initialBrideBio);
      setDraftBridePhotoUrl(initialBridePhotoUrl);
      setDraftBrideStoragePath(initialBrideStoragePath);

      setDraftStory(initialStory);
      setDraftClosingNotes(initialClosingNotes);

      setDraftRsvpTitle(initialRsvpTitle);
      setDraftRsvpDescription(initialRsvpDescription);
      setDraftRsvpMaxPax(initialRsvpMaxPax);
      setDraftRsvpAllowTentative(initialRsvpAllowTentative);
      setDraftRsvpAllowNotes(initialRsvpAllowNotes);

      setDraftGiftEnabled(initialGiftEnabled);
      setDraftGiftTitle(initialGiftTitle);
      setDraftGiftDescription(initialGiftDescription);
      setDraftGiftAccounts(initialGiftAccounts);
      setDraftGiftAddress(initialGiftAddress);
      setDraftMusic(initialMusic);
      setDraftCover(initialCover);

      // Muat template config & pastikan seksi terinisialisasi
      const config = await getInvitationTemplateConfig(id);
      let initialSections: InvitationSectionItem[] = [];

      if (config) {
        setPreviewConfig(config);
        const resolvedSections = await initializeInvitationSectionsFromTemplate(
          id,
          config.template?.default_sections
        );
        initialSections = resolvedSections;
        setDraftSections(resolvedSections);
      }

      // Muat data agenda acara (events)
      const eventsData = await getInvitationEvents(id);
      setDraftEvents(eventsData);

      // Muat data galeri foto (gallery_items)
      const galleryData = await getInvitationGalleryItems(id);
      setDraftGallery(galleryData);

      // Muat jumlah tamu (guests)
      const guestsData = await getInvitationGuests(id);
      setGuestCount(guestsData.length);

      // Simpan snapshot untuk melacak perubahan yang belum disimpan
      const initialSectionsJson = JSON.stringify(
        initialSections.map((s) => ({ id: s.id, order: s.display_order, enabled: s.is_enabled }))
      );
      const initialStoryJson = JSON.stringify(initialStory);
      const initialGiftAccountsJson = JSON.stringify(initialGiftAccounts);
      const initialGiftAddressJson = JSON.stringify(initialGiftAddress);
      const initialMusicJson = JSON.stringify(initialMusic);

      setSavedSnapshot({
        title: initialTitle,
        slug: initialSlug,
        eventType: initialEventType,
        allowRsvp: initialAllowRsvp,
        showWishes: initialShowWishes,
        rsvpTitle: initialRsvpTitle,
        rsvpDescription: initialRsvpDescription,
        rsvpMaxPax: initialRsvpMaxPax,
        rsvpAllowTentative: initialRsvpAllowTentative,
        rsvpAllowNotes: initialRsvpAllowNotes,
        giftEnabled: initialGiftEnabled,
        giftTitle: initialGiftTitle,
        giftDescription: initialGiftDescription,
        giftAccountsJson: initialGiftAccountsJson,
        giftAddressJson: initialGiftAddressJson,
        musicJson: initialMusicJson,
        coverJson: JSON.stringify(initialCover),
        heroHeadline: initialHeroHeadline,
        heroOpeningText: initialHeroOpeningText,
        heroCoupleNames: initialHeroCoupleNames,
        heroLocation: initialHeroLocation,
        groomName: initialGroomName,
        groomRole: initialGroomRole,
        groomParents: initialGroomParents,
        groomBio: initialGroomBio,
        groomPhotoUrl: initialGroomPhotoUrl,
        groomStoragePath: initialGroomStoragePath,
        brideName: initialBrideName,
        brideRole: initialBrideRole,
        brideParents: initialBrideParents,
        brideBio: initialBrideBio,
        bridePhotoUrl: initialBridePhotoUrl,
        brideStoragePath: initialBrideStoragePath,
        storyJson: initialStoryJson,
        closingNotes: initialClosingNotes,
        sectionsJson: initialSectionsJson,
      });
    } catch {
      setPageError('Terjadi kendala saat memuat data undangan. Silakan periksa koneksi dan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (musicPreviewAudio) {
        musicPreviewAudio.pause();
      }
    };
  }, [musicPreviewAudio]);

  // Evaluasi apakah ada perubahan form lokal yang belum disimpan ke database
  const currentSectionsJson = useMemo(() => {
    return JSON.stringify(
      draftSections.map((s) => ({ id: s.id, order: s.display_order, enabled: s.is_enabled }))
    );
  }, [draftSections]);

  const currentStoryJson = useMemo(() => JSON.stringify(draftStory), [draftStory]);
  const currentGiftAccountsJson = useMemo(() => JSON.stringify(draftGiftAccounts), [draftGiftAccounts]);
  const currentGiftAddressJson = useMemo(() => JSON.stringify(draftGiftAddress), [draftGiftAddress]);
  const currentMusicJson = useMemo(() => JSON.stringify(draftMusic), [draftMusic]);
  const currentCoverJson = useMemo(() => JSON.stringify(draftCover), [draftCover]);

  const hasUnsavedChanges = useMemo(() => {
    if (!invitation) return false;
    return (
      draftTitle !== savedSnapshot.title ||
      draftSlug !== savedSnapshot.slug ||
      draftEventType !== savedSnapshot.eventType ||
      draftAllowRsvp !== savedSnapshot.allowRsvp ||
      draftShowWishes !== savedSnapshot.showWishes ||
      draftRsvpTitle !== savedSnapshot.rsvpTitle ||
      draftRsvpDescription !== savedSnapshot.rsvpDescription ||
      draftRsvpMaxPax !== savedSnapshot.rsvpMaxPax ||
      draftRsvpAllowTentative !== savedSnapshot.rsvpAllowTentative ||
      draftRsvpAllowNotes !== savedSnapshot.rsvpAllowNotes ||
      draftGiftEnabled !== savedSnapshot.giftEnabled ||
      draftGiftTitle !== savedSnapshot.giftTitle ||
      draftGiftDescription !== savedSnapshot.giftDescription ||
      currentGiftAccountsJson !== savedSnapshot.giftAccountsJson ||
      currentGiftAddressJson !== savedSnapshot.giftAddressJson ||
      currentMusicJson !== savedSnapshot.musicJson ||
      currentCoverJson !== savedSnapshot.coverJson ||
      draftHeroHeadline !== savedSnapshot.heroHeadline ||
      draftHeroOpeningText !== savedSnapshot.heroOpeningText ||
      draftHeroCoupleNames !== savedSnapshot.heroCoupleNames ||
      draftHeroLocation !== savedSnapshot.heroLocation ||
      draftGroomName !== savedSnapshot.groomName ||
      draftGroomRole !== savedSnapshot.groomRole ||
      draftGroomParents !== savedSnapshot.groomParents ||
      draftGroomBio !== savedSnapshot.groomBio ||
      draftGroomPhotoUrl !== savedSnapshot.groomPhotoUrl ||
      draftGroomStoragePath !== savedSnapshot.groomStoragePath ||
      draftBrideName !== savedSnapshot.brideName ||
      draftBrideRole !== savedSnapshot.brideRole ||
      draftBrideParents !== savedSnapshot.brideParents ||
      draftBrideBio !== savedSnapshot.brideBio ||
      draftBridePhotoUrl !== savedSnapshot.bridePhotoUrl ||
      draftBrideStoragePath !== savedSnapshot.brideStoragePath ||
      currentStoryJson !== savedSnapshot.storyJson ||
      draftClosingNotes !== savedSnapshot.closingNotes ||
      currentSectionsJson !== savedSnapshot.sectionsJson
    );
  }, [
    invitation,
    draftTitle,
    draftSlug,
    draftEventType,
    draftAllowRsvp,
    draftShowWishes,
    draftRsvpTitle,
    draftRsvpDescription,
    draftRsvpMaxPax,
    draftRsvpAllowTentative,
    draftRsvpAllowNotes,
    draftGiftEnabled,
    draftGiftTitle,
    draftGiftDescription,
    currentGiftAccountsJson,
    currentGiftAddressJson,
    currentMusicJson,
    draftHeroHeadline,
    draftHeroOpeningText,
    draftHeroCoupleNames,
    draftHeroLocation,
    draftGroomName,
    draftGroomRole,
    draftGroomParents,
    draftGroomBio,
    draftGroomPhotoUrl,
    draftGroomStoragePath,
    draftBrideName,
    draftBrideRole,
    draftBrideParents,
    draftBrideBio,
    draftBridePhotoUrl,
    draftBrideStoragePath,
    currentStoryJson,
    draftClosingNotes,
    currentSectionsJson,
    currentCoverJson,
    savedSnapshot,
  ]);

  // Objek live invitation untuk preview lokal instan tanpa query
  const liveInvitation = useMemo(() => {
    if (!invitation) return null;
    return {
      id: invitation.id,
      title: draftTitle,
      slug: draftSlug,
      eventType: draftEventType,
      status: invitation.status,
      allowRsvp: draftAllowRsvp,
      showWishes: draftShowWishes,
      theme_override: invitation.theme_override,
    };
  }, [invitation, draftTitle, draftSlug, draftEventType, draftAllowRsvp, draftShowWishes]);

  // Objek live content untuk preview lokal instan tanpa query
  const liveContent = useMemo<InvitationContent>(() => {
    const hosts: InvitationContentHost[] = [];
    if (draftGroomName.trim() || draftGroomPhotoUrl) {
      hosts.push({
        name: draftGroomName.trim(),
        role: draftGroomRole.trim() || 'Mempelai Pria',
        parents: draftGroomParents.trim() || undefined,
        bio: draftGroomBio.trim() || undefined,
        photo_url: draftGroomPhotoUrl || undefined,
        storage_path: draftGroomStoragePath || undefined,
      });
    }
    if (draftBrideName.trim() || draftBridePhotoUrl) {
      hosts.push({
        name: draftBrideName.trim(),
        role: draftBrideRole.trim() || 'Mempelai Wanita',
        parents: draftBrideParents.trim() || undefined,
        bio: draftBrideBio.trim() || undefined,
        photo_url: draftBridePhotoUrl || undefined,
        storage_path: draftBrideStoragePath || undefined,
      });
    }

    return {
      hero: {
        headline: draftHeroHeadline.trim() || undefined,
        opening_text: draftHeroOpeningText.trim() || undefined,
        couple_names: draftHeroCoupleNames.trim() || undefined,
        location_short: draftHeroLocation.trim() || undefined,
      },
      hosts,
      story: draftStory,
      closing_notes: draftClosingNotes.trim(),
      rsvp: {
        title: draftRsvpTitle.trim() || undefined,
        description: draftRsvpDescription.trim() || undefined,
        max_pax_default: draftRsvpMaxPax,
        allow_tentative: draftRsvpAllowTentative,
        allow_notes: draftRsvpAllowNotes,
      },
      gift: {
        is_enabled: draftGiftEnabled,
        title: draftGiftTitle.trim() || undefined,
        description: draftGiftDescription.trim() || undefined,
        accounts: draftGiftAccounts,
        physical_address: draftGiftAddress,
      },
      music: draftMusic,
      cover: draftCover,
    };
  }, [
    draftHeroHeadline,
    draftHeroOpeningText,
    draftHeroCoupleNames,
    draftHeroLocation,
    draftGroomName,
    draftGroomRole,
    draftGroomParents,
    draftGroomBio,
    draftGroomPhotoUrl,
    draftGroomStoragePath,
    draftBrideName,
    draftBrideRole,
    draftBrideParents,
    draftBrideBio,
    draftBridePhotoUrl,
    draftBrideStoragePath,
    draftStory,
    draftClosingNotes,
    draftRsvpTitle,
    draftRsvpDescription,
    draftRsvpMaxPax,
    draftRsvpAllowTentative,
    draftRsvpAllowNotes,
    draftGiftEnabled,
    draftGiftTitle,
    draftGiftDescription,
    draftGiftAccounts,
    draftGiftAddress,
    draftMusic,
    draftCover,
  ]);

  // Handler simpan satu tombol untuk form pengaturan, hero, mempelai, dan cerita
  const handleSaveAll = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !invitation) return;

    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    // 1. Validasi input client
    const cleanTitle = draftTitle.trim();
    if (!cleanTitle) {
      setSaveErrorMessage('Judul undangan tidak boleh kosong.');
      return;
    }
    if (cleanTitle.length > 120) {
      setSaveErrorMessage('Judul undangan maksimal 120 karakter.');
      return;
    }

    const cleanSlug = draftSlug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (cleanSlug.length < 3 || cleanSlug.length > 60 || !slugRegex.test(cleanSlug)) {
      setSaveErrorMessage(
        'Format tautan (slug) harus berupa huruf kecil, angka, dan tanda hubung (-) dengan panjang 3 sampai 60 karakter.'
      );
      return;
    }

    if (draftMusic.enabled) {
      try {
        validateMusicConfig(draftMusic);
      } catch (err: unknown) {
        if (err instanceof ValidationError) {
          setSaveErrorMessage(err.message);
        } else {
          setSaveErrorMessage('Konfigurasi musik tidak valid.');
        }
        return;
      }
    }

    if (draftCover.enabled) {
      try {
        validateCoverConfig(draftCover);
      } catch (err: unknown) {
        if (err instanceof ValidationError) {
          setSaveErrorMessage(err.message);
        } else {
          setSaveErrorMessage('Konfigurasi cover tidak valid.');
        }
        return;
      }
    }

    // Jika tidak ada perubahan, hentikan tanpa request
    if (!hasUnsavedChanges) {
      setSaveSuccessMessage('Tidak ada perubahan baru untuk disimpan.');
      return;
    }

    setIsSaving(true);

    try {
      const updateTasks: Promise<unknown>[] = [];

      // A. Periksa perubahan data inti
      const isCoreChanged =
        cleanTitle !== savedSnapshot.title ||
        cleanSlug !== savedSnapshot.slug ||
        draftEventType !== savedSnapshot.eventType ||
        draftAllowRsvp !== savedSnapshot.allowRsvp ||
        draftShowWishes !== savedSnapshot.showWishes;

      if (isCoreChanged) {
        updateTasks.push(
          updateInvitationCore(id, {
            title: cleanTitle,
            slug: cleanSlug,
            event_type: draftEventType,
            allow_rsvp: draftAllowRsvp,
            show_wishes: draftShowWishes,
          })
        );
      }

      // B. Periksa perubahan konten mempelai, hero, cerita, dan rsvp (invitation_data)
      const isContentChanged =
        draftHeroHeadline !== savedSnapshot.heroHeadline ||
        draftHeroOpeningText !== savedSnapshot.heroOpeningText ||
        draftHeroCoupleNames !== savedSnapshot.heroCoupleNames ||
        draftHeroLocation !== savedSnapshot.heroLocation ||
        draftGroomName !== savedSnapshot.groomName ||
        draftGroomRole !== savedSnapshot.groomRole ||
        draftGroomParents !== savedSnapshot.groomParents ||
        draftGroomBio !== savedSnapshot.groomBio ||
        draftGroomPhotoUrl !== savedSnapshot.groomPhotoUrl ||
        draftGroomStoragePath !== savedSnapshot.groomStoragePath ||
        draftBrideName !== savedSnapshot.brideName ||
        draftBrideRole !== savedSnapshot.brideRole ||
        draftBrideParents !== savedSnapshot.brideParents ||
        draftBrideBio !== savedSnapshot.brideBio ||
        draftBridePhotoUrl !== savedSnapshot.bridePhotoUrl ||
        draftBrideStoragePath !== savedSnapshot.brideStoragePath ||
        currentStoryJson !== savedSnapshot.storyJson ||
        draftClosingNotes !== savedSnapshot.closingNotes ||
        draftRsvpTitle !== savedSnapshot.rsvpTitle ||
        draftRsvpDescription !== savedSnapshot.rsvpDescription ||
        draftRsvpMaxPax !== savedSnapshot.rsvpMaxPax ||
        draftRsvpAllowTentative !== savedSnapshot.rsvpAllowTentative ||
        draftRsvpAllowNotes !== savedSnapshot.rsvpAllowNotes ||
        draftGiftEnabled !== savedSnapshot.giftEnabled ||
        draftGiftTitle !== savedSnapshot.giftTitle ||
        draftGiftDescription !== savedSnapshot.giftDescription ||
        currentGiftAccountsJson !== savedSnapshot.giftAccountsJson ||
        currentGiftAddressJson !== savedSnapshot.giftAddressJson ||
        currentMusicJson !== savedSnapshot.musicJson ||
        currentCoverJson !== savedSnapshot.coverJson;

      if (isContentChanged) {
        updateTasks.push(upsertInvitationData(id, liveContent));
      }

      // C. Periksa perubahan seksi (invitation_sections)
      const isSectionsChanged = currentSectionsJson !== savedSnapshot.sectionsJson;
      if (isSectionsChanged) {
        updateTasks.push(
          updateInvitationSections(
            id,
            draftSections.map((s) => ({
              id: s.id,
              display_order: s.display_order,
              is_enabled: s.is_enabled,
            }))
          )
        );
      }

      // Jalankan seluruh pembaruan secara paralel
      await Promise.all(updateTasks);

      // Perbarui snapshot tersimpan
      setSavedSnapshot({
        title: cleanTitle,
        slug: cleanSlug,
        eventType: draftEventType,
        allowRsvp: draftAllowRsvp,
        showWishes: draftShowWishes,
        rsvpTitle: draftRsvpTitle,
        rsvpDescription: draftRsvpDescription,
        rsvpMaxPax: draftRsvpMaxPax,
        rsvpAllowTentative: draftRsvpAllowTentative,
        rsvpAllowNotes: draftRsvpAllowNotes,
        giftEnabled: draftGiftEnabled,
        giftTitle: draftGiftTitle,
        giftDescription: draftGiftDescription,
        giftAccountsJson: currentGiftAccountsJson,
        giftAddressJson: currentGiftAddressJson,
        musicJson: currentMusicJson,
        coverJson: currentCoverJson,
        heroHeadline: draftHeroHeadline,
        heroOpeningText: draftHeroOpeningText,
        heroCoupleNames: draftHeroCoupleNames,
        heroLocation: draftHeroLocation,
        groomName: draftGroomName,
        groomRole: draftGroomRole,
        groomParents: draftGroomParents,
        groomBio: draftGroomBio,
        groomPhotoUrl: draftGroomPhotoUrl,
        groomStoragePath: draftGroomStoragePath,
        brideName: draftBrideName,
        brideRole: draftBrideRole,
        brideParents: draftBrideParents,
        brideBio: draftBrideBio,
        bridePhotoUrl: draftBridePhotoUrl,
        brideStoragePath: draftBrideStoragePath,
        storyJson: currentStoryJson,
        closingNotes: draftClosingNotes,
        sectionsJson: currentSectionsJson,
      });

      setInvitation((prev) =>
        prev
          ? {
              ...prev,
              title: cleanTitle,
              slug: cleanSlug,
              event_type: draftEventType,
              allow_rsvp: draftAllowRsvp,
              show_wishes: draftShowWishes,
            }
          : null
      );

      setSaveSuccessMessage('Seluruh perubahan berhasil disimpan.');
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        setSaveErrorMessage(err.message);
      } else if (err instanceof DatabaseError) {
        setSaveErrorMessage(err.message);
      } else if (err instanceof AuthorizationError) {
        setSaveErrorMessage(err.message);
      } else {
        setSaveErrorMessage('Gagal menyimpan perubahan. Silakan periksa kembali isian formulir Anda.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handler unggah foto mempelai / host
  const handleUploadCouplePhoto = async (slot: 'groom' | 'bride', file: File) => {
    if (!id) return;
    const isGroom = slot === 'groom';
    if (isGroom) {
      setIsUploadingGroomPhoto(true);
      setGroomPhotoError(null);
    } else {
      setIsUploadingBridePhoto(true);
      setBridePhotoError(null);
    }

    try {
      const result = await uploadCouplePhoto(id, file, slot);
      const oldStoragePath = isGroom ? draftGroomStoragePath : draftBrideStoragePath;
      if (oldStoragePath && oldStoragePath !== result.storage_path) {
        deleteGalleryImageFile(oldStoragePath).catch(() => {});
      }

      if (isGroom) {
        setDraftGroomPhotoUrl(result.photo_url);
        setDraftGroomStoragePath(result.storage_path);
      } else {
        setDraftBridePhotoUrl(result.photo_url);
        setDraftBrideStoragePath(result.storage_path);
      }
      setSaveSuccessMessage(`Foto ${isGroom ? 'mempelai pria' : 'mempelai wanita'} berhasil diunggah.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto.';
      if (isGroom) setGroomPhotoError(msg);
      else setBridePhotoError(msg);
    } finally {
      if (isGroom) setIsUploadingGroomPhoto(false);
      else setIsUploadingBridePhoto(false);
    }
  };

  // Handler hapus foto mempelai / host
  const handleDeleteCouplePhoto = async (slot: 'groom' | 'bride') => {
    const isGroom = slot === 'groom';
    const targetStoragePath = isGroom ? draftGroomStoragePath : draftBrideStoragePath;
    if (targetStoragePath) {
      deleteGalleryImageFile(targetStoragePath).catch(() => {});
    }
    if (isGroom) {
      setDraftGroomPhotoUrl('');
      setDraftGroomStoragePath('');
      setGroomPhotoError(null);
    } else {
      setDraftBridePhotoUrl('');
      setDraftBrideStoragePath('');
      setBridePhotoError(null);
    }
  };

  // Handler Linimasa Cerita (Story)
  const handleOpenCreateStoryModal = () => {
    setEditingStoryId(null);
    setStoryForm({ title: '', date: '', description: '' });
    setStoryErrorMessage(null);
    setStoryModalOpen(true);
  };

  const handleOpenEditStoryModal = (item: InvitationContentStoryItem) => {
    setEditingStoryId(item.id);
    setStoryForm({
      title: item.title,
      date: item.date || '',
      description: item.description,
    });
    setStoryErrorMessage(null);
    setStoryModalOpen(true);
  };

  const handleSaveStory = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = storyForm.title.trim();
    const cleanDesc = storyForm.description.trim();

    if (!cleanTitle) {
      setStoryErrorMessage('Judul momen cerita wajib diisi.');
      return;
    }
    if (!cleanDesc) {
      setStoryErrorMessage('Isi cerita momen wajib diisi.');
      return;
    }

    if (editingStoryId) {
      setDraftStory((prev) =>
        prev.map((item) =>
          item.id === editingStoryId
            ? {
                ...item,
                title: cleanTitle,
                date: storyForm.date.trim() || undefined,
                description: cleanDesc,
              }
            : item
        )
      );
    } else {
      const newItem: InvitationContentStoryItem = {
        id: crypto.randomUUID(),
        title: cleanTitle,
        date: storyForm.date.trim() || undefined,
        description: cleanDesc,
        display_order: draftStory.length,
        is_enabled: true,
      };
      setDraftStory((prev) => [...prev, newItem]);
    }

    setStoryModalOpen(false);
    setStoryForm({ title: '', date: '', description: '' });
    setStoryErrorMessage(null);
  };

  const handleMoveStoryUp = (index: number) => {
    if (index <= 0) return;
    setDraftStory((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const prevItem = copy[index - 1];
      if (!target || !prevItem) return prev;
      copy[index - 1] = target;
      copy[index] = prevItem;
      return copy.map((item, idx) => ({ ...item, display_order: idx }));
    });
  };

  const handleMoveStoryDown = (index: number) => {
    if (index >= draftStory.length - 1) return;
    setDraftStory((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const nextItem = copy[index + 1];
      if (!target || !nextItem) return prev;
      copy[index + 1] = target;
      copy[index] = nextItem;
      return copy.map((item, idx) => ({ ...item, display_order: idx }));
    });
  };

  const handleToggleStoryEnabled = (storyId: string) => {
    setDraftStory((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, is_enabled: !s.is_enabled } : s))
    );
  };

  const handleConfirmDeleteStory = () => {
    if (!storyToDelete) return;
    setDraftStory((prev) =>
      prev
        .filter((s) => s.id !== storyToDelete.id)
        .map((item, idx) => ({ ...item, display_order: idx }))
    );
    setDeleteStoryModalOpen(false);
    setStoryToDelete(null);
  };

  // Handler toggle aktif/nonaktif seksi di draft lokal
  const handleToggleSection = (sectionId: string) => {
    setDraftSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, is_enabled: !s.is_enabled } : s))
    );
  };

  // Handler memindahkan urutan seksi ke atas
  const handleMoveSectionUp = (index: number) => {
    if (index <= 0) return;
    setDraftSections((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const previous = copy[index - 1];
      if (!target || !previous) return prev;
      copy[index - 1] = target;
      copy[index] = previous;
      return copy.map((item, idx) => ({ ...item, display_order: idx }));
    });
  };

  // Handler memindahkan urutan seksi ke bawah
  const handleMoveSectionDown = (index: number) => {
    if (index >= draftSections.length - 1) return;
    setDraftSections((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const next = copy[index + 1];
      if (!target || !next) return prev;
      copy[index + 1] = target;
      copy[index] = next;
      return copy.map((item, idx) => ({ ...item, display_order: idx }));
    });
  };

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleOpenCreateEventModal = () => {
    setEditingEventId(null);
    setEventForm({
      title: '',
      start_time: '',
      end_time: '',
      timezone: 'Asia/Jakarta',
      venue_name: '',
      address: '',
      maps_url: '',
      is_primary: draftEvents.length === 0, // Event pertama otomatis menjadi primary
    });
    setEventErrorMessage(null);
    setEventModalOpen(true);
  };

  const handleOpenEditEventModal = (evt: InvitationEventItem) => {
    setEditingEventId(evt.id);
    setEventForm({
      title: evt.title,
      start_time: toDatetimeLocal(evt.start_time),
      end_time: toDatetimeLocal(evt.end_time),
      timezone: evt.timezone || 'Asia/Jakarta',
      venue_name: evt.venue_name || '',
      address: evt.address || '',
      maps_url: evt.maps_url || '',
      is_primary: evt.is_primary,
    });
    setEventErrorMessage(null);
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setEventErrorMessage(null);

    const cleanTitle = eventForm.title.trim();
    if (!cleanTitle) {
      setEventErrorMessage('Nama acara wajib diisi.');
      return;
    }

    if (!eventForm.start_time) {
      setEventErrorMessage('Waktu mulai acara wajib diisi.');
      return;
    }

    const cleanVenue = eventForm.venue_name.trim();
    if (!cleanVenue) {
      setEventErrorMessage('Nama tempat atau lokasi acara wajib diisi.');
      return;
    }

    if (eventForm.end_time) {
      const start = new Date(eventForm.start_time).getTime();
      const end = new Date(eventForm.end_time).getTime();
      if (end < start) {
        setEventErrorMessage('Waktu selesai tidak boleh lebih awal dari waktu mulai acara.');
        return;
      }
    }

    if (eventForm.maps_url && eventForm.maps_url.trim()) {
      if (!/^https?:\/\//i.test(eventForm.maps_url.trim())) {
        setEventErrorMessage('Tautan Google Maps harus diawali dengan http:// atau https://');
        return;
      }
    }

    setIsSavingEvent(true);

    try {
      const startIso = new Date(eventForm.start_time).toISOString();
      const endIso = eventForm.end_time ? new Date(eventForm.end_time).toISOString() : null;

      if (editingEventId) {
        // Mode Perbarui Acara
        const updated = await updateInvitationEvent(editingEventId, id, {
          title: cleanTitle,
          start_time: startIso,
          end_time: endIso,
          timezone: eventForm.timezone,
          venue_name: cleanVenue,
          address: eventForm.address.trim() || null,
          maps_url: eventForm.maps_url.trim() || null,
          is_primary: eventForm.is_primary,
        });

        setDraftEvents((prev) =>
          prev.map((e) => {
            if (e.id === editingEventId) return updated;
            if (eventForm.is_primary) return { ...e, is_primary: false };
            return e;
          })
        );
      } else {
        // Mode Buat Acara Baru
        const created = await createInvitationEvent(id, {
          title: cleanTitle,
          start_time: startIso,
          end_time: endIso,
          timezone: eventForm.timezone,
          venue_name: cleanVenue,
          address: eventForm.address.trim() || null,
          maps_url: eventForm.maps_url.trim() || null,
          is_primary: eventForm.is_primary,
        });

        setDraftEvents((prev) => {
          const list = eventForm.is_primary
            ? prev.map((e) => ({ ...e, is_primary: false }))
            : [...prev];
          return [...list, created].sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
        });
      }

      setEventModalOpen(false);
      setSaveSuccessMessage('Agenda acara berhasil disimpan.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEventErrorMessage(err.message);
      } else {
        setEventErrorMessage('Gagal menyimpan agenda acara.');
      }
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleSetPrimaryEvent = async (evt: InvitationEventItem) => {
    if (!id || evt.is_primary) return;
    try {
      await updateInvitationEvent(evt.id, id, { is_primary: true });
      setDraftEvents((prev) =>
        prev.map((e) => ({ ...e, is_primary: e.id === evt.id }))
      );
      setSaveSuccessMessage(`"${evt.title}" telah dijadikan acara utama.`);
    } catch {
      alert('Gagal menetapkan acara utama. Silakan coba kembali.');
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!id || !eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      await deleteInvitationEvent(eventToDelete.id, id);
      setDraftEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setDeleteEventModalOpen(false);
      setEventToDelete(null);
      setSaveSuccessMessage('Agenda acara berhasil dihapus.');
    } catch {
      alert('Gagal menghapus acara. Silakan periksa koneksi Anda dan coba lagi.');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // ==========================================
  // GALLERY HANDLERS
  // ==========================================

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleOpenUploadModal = () => {
    setStagedFiles([]);
    setUploadErrorMessage(null);
    setUploadProgress(null);
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    if (isUploading) return;
    stagedFiles.forEach((f) => {
      try {
        URL.revokeObjectURL(f.previewUrl);
      } catch {
        // Abaikan pembersihan
      }
    });
    setStagedFiles([]);
    setUploadErrorMessage(null);
    setUploadProgress(null);
    setUploadModalOpen(false);
  };

  const handleSelectFiles = (fileList: FileList | File[]) => {
    setUploadErrorMessage(null);
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    if (stagedFiles.length + filesArray.length > 5) {
      setUploadErrorMessage('Maksimal 5 foto dalam satu batch pengunggahan untuk menjaga stabilitas jaringan.');
      return;
    }

    const newlyStaged: StagedUploadFile[] = [];
    for (const file of filesArray) {
      try {
        validateGalleryImageFile(file);
        newlyStaged.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          caption: '',
          sizeFormatted: formatFileSize(file.size),
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setUploadErrorMessage(err.message);
        } else {
          setUploadErrorMessage('Format atau ukuran salah satu berkas tidak valid.');
        }
        return;
      }
    }

    setStagedFiles((prev) => [...prev, ...newlyStaged]);
  };

  const handleRemoveStagedFile = (idToRemove: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((f) => f.id === idToRemove);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // Abaikan pembersihan
        }
      }
      return prev.filter((f) => f.id !== idToRemove);
    });
  };

  const handleUpdateStagedCaption = (idToUpdate: string, newCaption: string) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === idToUpdate ? { ...f, caption: newCaption } : f))
    );
  };

  const handleStartUpload = async () => {
    if (!id || stagedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadErrorMessage(null);

    const uploadedResults: InvitationGalleryItem[] = [];
    const baseOrder = draftGallery.length;

    try {
      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        if (!item) continue;
        setUploadProgress({
          current: i + 1,
          total: stagedFiles.length,
          fileName: item.file.name,
        });

        const createdItem = await uploadInvitationGalleryPhoto(
          id,
          item.file,
          item.caption,
          baseOrder + i
        );
        uploadedResults.push(createdItem);
      }

      // Update state galeri lokal seketika agar preview undangan langsung update
      setDraftGallery((prev) => [...prev, ...uploadedResults]);
      setSaveSuccessMessage(`${uploadedResults.length} foto berhasil diunggah ke galeri.`);

      // Bersihkan object URLs
      stagedFiles.forEach((f) => {
        try {
          URL.revokeObjectURL(f.previewUrl);
        } catch {
          // Abaikan pembersihan
        }
      });
      setStagedFiles([]);
      setUploadProgress(null);
      setUploadModalOpen(false);
    } catch (err: unknown) {
      if (uploadedResults.length > 0) {
        setDraftGallery((prev) => [...prev, ...uploadedResults]);
        setStagedFiles((prev) => prev.slice(uploadedResults.length));
      }
      if (err instanceof Error) {
        setUploadErrorMessage(err.message);
      } else {
        setUploadErrorMessage('Gagal mengunggah foto ke penyimpanan.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEditGalleryModal = (item: InvitationGalleryItem) => {
    setEditingGalleryItem(item);
    setEditCaption(item.caption || '');
    setEditGalleryErrorMessage(null);
    setEditGalleryModalOpen(true);
  };

  const handleSaveEditCaption = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !editingGalleryItem) return;

    const cleanCaption = editCaption.trim();
    if (cleanCaption.length > 200) {
      setEditGalleryErrorMessage('Keterangan foto maksimal 200 karakter.');
      return;
    }

    setIsSavingEditGallery(true);
    setEditGalleryErrorMessage(null);

    try {
      const updated = await updateInvitationGalleryItem(editingGalleryItem.id, id, {
        caption: cleanCaption || null,
      });

      setDraftGallery((prev) =>
        prev.map((g) => (g.id === editingGalleryItem.id ? updated : g))
      );
      setEditGalleryModalOpen(false);
      setEditingGalleryItem(null);
      setSaveSuccessMessage('Keterangan foto berhasil disimpan.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditGalleryErrorMessage(err.message);
      } else {
        setEditGalleryErrorMessage('Gagal memperbarui keterangan foto.');
      }
    } finally {
      setIsSavingEditGallery(false);
    }
  };

  const handleMoveGalleryUp = async (index: number) => {
    if (!id || index <= 0) return;
    const copy = [...draftGallery];
    const target = copy[index];
    const previous = copy[index - 1];
    if (!target || !previous) return;
    copy[index - 1] = target;
    copy[index] = previous;
    const reordered = copy.map((item, idx) => ({ ...item, display_order: idx }));
    setDraftGallery(reordered);

    try {
      await updateGalleryItemsOrder(
        id,
        reordered.map((g) => ({ id: g.id, display_order: g.display_order }))
      );
    } catch {
      // Abaikan jika sinkronisasi urutan tertunda
    }
  };

  const handleMoveGalleryDown = async (index: number) => {
    if (!id || index >= draftGallery.length - 1) return;
    const copy = [...draftGallery];
    const target = copy[index];
    const next = copy[index + 1];
    if (!target || !next) return;
    copy[index + 1] = target;
    copy[index] = next;
    const reordered = copy.map((item, idx) => ({ ...item, display_order: idx }));
    setDraftGallery(reordered);

    try {
      await updateGalleryItemsOrder(
        id,
        reordered.map((g) => ({ id: g.id, display_order: g.display_order }))
      );
    } catch {
      // Abaikan jika sinkronisasi urutan tertunda
    }
  };

  const handleConfirmDeleteGallery = async () => {
    if (!id || !galleryToDelete) return;
    setIsDeletingGallery(true);
    setDeleteGalleryErrorMessage(null);

    try {
      await deleteInvitationGalleryPhoto(galleryToDelete, id);
      setDraftGallery((prev) => prev.filter((g) => g.id !== galleryToDelete.id));
      setDeleteGalleryModalOpen(false);
      setGalleryToDelete(null);
      setSaveSuccessMessage('Foto berhasil dihapus dari galeri dan penyimpanan.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteGalleryErrorMessage(err.message);
      } else {
        setDeleteGalleryErrorMessage('Gagal menghapus foto dari galeri.');
      }
    } finally {
      setIsDeletingGallery(false);
    }
  };

  // Validasi sebelum membuka modal publikasi
  const handleOpenPublishModal = () => {
    const errors: string[] = [];

    const cleanTitle = draftTitle.trim();
    if (!cleanTitle) {
      errors.push('Judul undangan wajib diisi.');
    }

    const cleanSlug = draftSlug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (cleanSlug.length < 3 || cleanSlug.length > 60 || !slugRegex.test(cleanSlug)) {
      errors.push('Format tautan (slug) tidak valid (3 sampai 60 karakter huruf kecil, angka, tanda hubung).');
    }

    const hasGroom = draftGroomName.trim().length > 0;
    const hasBride = draftBrideName.trim().length > 0;
    if (!hasGroom && !hasBride) {
      errors.push('Setidaknya satu nama mempelai (pria atau wanita) wajib diisi sebelum publikasi.');
    }

    if (hasUnsavedChanges) {
      errors.push('Terdapat perubahan formulir yang belum disimpan. Silakan simpan perubahan terlebih dahulu.');
    }

    setPublishValidationErrors(errors);
    setPublishModalOpen(true);
  };

  // Eksekusi publikasi
  const handleConfirmPublish = async () => {
    if (!id) return;
    setIsPublishing(true);

    try {
      const res = await publishInvitation(id);
      setInvitation((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              published_at: res.published_at,
            }
          : null
      );
      setPublishModalOpen(false);
      setPublishSuccessModalOpen(true);
      setSaveSuccessMessage('Undangan berhasil dipublikasikan.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPublishValidationErrors([err.message]);
      } else {
        setPublishValidationErrors(['Terjadi kendala saat mempublikasikan undangan.']);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Eksekusi unpublish (kembalikan ke status draf)
  const handleConfirmUnpublish = async () => {
    if (!id) return;
    setIsUnpublishing(true);
    setUnpublishError(null);

    try {
      const res = await unpublishInvitation(id);
      setInvitation((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              published_at: res.published_at,
            }
          : null
      );
      setUnpublishModalOpen(false);
      setSaveSuccessMessage('Undangan telah dikembalikan ke status draf.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUnpublishError(err.message);
      } else {
        setUnpublishError('Gagal mengubah status undangan ke draf.');
      }
    } finally {
      setIsUnpublishing(false);
    }
  };

  // Eksekusi penghapusan undangan
  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);

    try {
      await deleteMyInvitation(id);
      navigate('/dashboard');
    } catch {
      alert('Gagal menghapus undangan. Silakan periksa koneksi Anda dan coba lagi.');
      setIsDeleting(false);
    }
  };

  // Salin tautan publik ke clipboard
  const handleCopyLink = () => {
    if (!invitation) return;
    const url = `${window.location.origin}/i/${invitation.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  if (loading) {
    return (
      <div className="py-24 max-w-2xl mx-auto text-center">
        <p className="text-xs text-text-muted font-medium" role="status">
          Memuat ruang kerja editor undangan...
        </p>
      </div>
    );
  }

  if (pageError || !invitation) {
    return (
      <div className="py-16 max-w-xl mx-auto">
        <div className="bg-surface border border-border rounded p-6 shadow-sm text-center space-y-4">
          <h1 className="font-serif text-xl font-bold text-primary">
            Akses Dibatasi atau Tidak Ditemukan
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            {pageError ?? 'Undangan tidak ditemukan atau Anda tidak memiliki hak akses ke data ini.'}
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-block py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // HANDLER: KELOLA REKENING & DOMPET DIGITAL (GIFT)
  // ============================================================
  const handleOpenAddGiftAccountModal = () => {
    setEditingGiftAccountId(null);
    setGiftAccountForm({
      type: 'bank',
      provider: '',
      account_number: '',
      holder_name: '',
      label: '',
      is_enabled: true,
    });
    setGiftAccountError(null);
    setGiftAccountModalOpen(true);
  };

  const handleOpenEditGiftAccountModal = (acc: InvitationContentGiftAccount) => {
    setEditingGiftAccountId(acc.id);
    setGiftAccountForm({
      type: acc.type || 'bank',
      provider: acc.provider || '',
      account_number: acc.account_number || '',
      holder_name: acc.holder_name || '',
      label: acc.label || '',
      is_enabled: acc.is_enabled !== false,
    });
    setGiftAccountError(null);
    setGiftAccountModalOpen(true);
  };

  const handleSaveGiftAccount = (e: FormEvent) => {
    e.preventDefault();
    setGiftAccountError(null);

    const cleanProvider = giftAccountForm.provider.trim();
    const cleanNumber = giftAccountForm.account_number.trim();
    const cleanHolder = giftAccountForm.holder_name.trim();
    const cleanLabel = giftAccountForm.label.trim();

    if (!cleanProvider) {
      setGiftAccountError('Nama bank atau penyedia dompet digital wajib diisi.');
      return;
    }
    if (cleanProvider.length > 50) {
      setGiftAccountError('Nama bank atau penyedia maksimal 50 karakter.');
      return;
    }
    if (!cleanNumber) {
      setGiftAccountError('Nomor rekening atau nomor akun e-wallet wajib diisi.');
      return;
    }
    if (cleanNumber.length > 50) {
      setGiftAccountError('Nomor rekening atau nomor akun maksimal 50 karakter.');
      return;
    }
    if (!cleanHolder) {
      setGiftAccountError('Nama pemilik rekening atau akun wajib diisi.');
      return;
    }
    if (cleanHolder.length > 100) {
      setGiftAccountError('Nama pemilik rekening maksimal 100 karakter.');
      return;
    }

    if (editingGiftAccountId) {
      setDraftGiftAccounts((prev) =>
        prev.map((acc) =>
          acc.id === editingGiftAccountId
            ? {
                ...acc,
                type: giftAccountForm.type,
                provider: cleanProvider,
                account_number: cleanNumber,
                holder_name: cleanHolder,
                label: cleanLabel || undefined,
                is_enabled: giftAccountForm.is_enabled,
              }
            : acc
        )
      );
    } else {
      const newAccount: InvitationContentGiftAccount = {
        id: `gift-${Date.now()}`,
        type: giftAccountForm.type,
        provider: cleanProvider,
        account_number: cleanNumber,
        holder_name: cleanHolder,
        label: cleanLabel || undefined,
        display_order: draftGiftAccounts.length,
        is_enabled: giftAccountForm.is_enabled,
      };
      setDraftGiftAccounts((prev) => [...prev, newAccount]);
    }

    setGiftAccountModalOpen(false);
  };

  const handleConfirmDeleteGiftAccount = () => {
    if (!accountToDelete) return;
    setDraftGiftAccounts((prev) =>
      prev
        .filter((acc) => acc.id !== accountToDelete.id)
        .map((acc, idx) => ({ ...acc, display_order: idx }))
    );
    setDeleteGiftAccountModalOpen(false);
    setAccountToDelete(null);
  };

  const handleMoveGiftAccountUp = (index: number) => {
    if (index <= 0) return;
    setDraftGiftAccounts((prev) => {
      const copy = [...prev];
      const prevItem = copy[index - 1];
      const currItem = copy[index];
      if (!prevItem || !currItem) return prev;
      copy[index - 1] = currItem;
      copy[index] = prevItem;
      return copy.map((acc, idx) => ({ ...acc, display_order: idx }));
    });
  };

  const handleMoveGiftAccountDown = (index: number) => {
    if (index >= draftGiftAccounts.length - 1) return;
    setDraftGiftAccounts((prev) => {
      const copy = [...prev];
      const currItem = copy[index];
      const nextItem = copy[index + 1];
      if (!currItem || !nextItem) return prev;
      copy[index] = nextItem;
      copy[index + 1] = currItem;
      return copy.map((acc, idx) => ({ ...acc, display_order: idx }));
    });
  };

  const handleToggleGiftAccountEnabled = (idToToggle: string) => {
    setDraftGiftAccounts((prev) =>
      prev.map((acc) =>
        acc.id === idToToggle ? { ...acc, is_enabled: !acc.is_enabled } : acc
      )
    );
  };

  // ============================================================
  // HANDLER: PENGATURAN MUSIK LATAR (MUSIC)
  // ============================================================
  const handleToggleMusicPreview = () => {
    if (musicPreviewPlaying && musicPreviewAudio) {
      musicPreviewAudio.pause();
      setMusicPreviewPlaying(false);
      return;
    }

    if (!isValidAudioUrl(draftMusic.audio_url)) {
      setMusicPreviewError('Tautan audio tidak valid. Harap gunakan alamat URL dengan protokol http:// atau https://.');
      return;
    }

    setMusicPreviewError(null);

    try {
      let audio = musicPreviewAudio;
      if (!audio || audio.src !== draftMusic.audio_url) {
        if (audio) {
          audio.pause();
        }
        audio = new Audio(draftMusic.audio_url);
        setMusicPreviewAudio(audio);
      }

      audio.volume = draftMusic.volume;
      audio.loop = draftMusic.loop;

      audio.onended = () => {
        if (!draftMusic.loop) {
          setMusicPreviewPlaying(false);
        }
      };

      audio.onerror = () => {
        setMusicPreviewError('Gagal memuat berkas audio dari tautan tersebut. Harap pastikan tautan dapat diakses publik.');
        setMusicPreviewPlaying(false);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setMusicPreviewPlaying(true);
          })
          .catch((err: unknown) => {
            setMusicPreviewPlaying(false);
            if (err instanceof Error) {
              setMusicPreviewError(`Pemutaran dicegah: ${err.message}`);
            } else {
              setMusicPreviewError('Berkas audio tidak dapat diputar.');
            }
          });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMusicPreviewError(err.message);
      } else {
        setMusicPreviewError('Kendala saat memutar audio.');
      }
      setMusicPreviewPlaying(false);
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Toolbar Editor */}
      <header className="bg-surface border border-border rounded p-5 shadow-sm space-y-4">
        {/* Baris Navigasi Atas & Info Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
            >
              &larr; Dashboard
            </Link>
            <span className="text-border-strong text-xs">/</span>
            <span className="text-xs text-text-subtle font-mono truncate max-w-[200px]">
              {invitation.slug}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasUnsavedChanges && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                Ada perubahan belum disimpan
              </span>
            )}
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                invitation.status === 'published'
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border bg-surface-elevated text-text-muted'
              }`}
            >
              {invitation.status === 'published' ? 'Dipublikasikan' : 'Draf'}
            </span>
          </div>
        </div>

        {/* Baris Judul & Tombol Aksi Utama */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
              {draftTitle || 'Tanpa Judul'}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Template: <strong className="font-medium text-text-primary">{previewConfig?.template?.name ?? 'Classic Elegance'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Simpan Perubahan */}
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={isSaving}
              className="py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>

            {/* Tombol Publikasi / Unpublish */}
            {invitation.status === 'draft' ? (
              <button
                type="button"
                onClick={handleOpenPublishModal}
                disabled={isSaving || isPublishing}
                className="py-2 px-4 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Publikasikan
              </button>
            ) : (
              <>
                <Link
                  to={`/i/${invitation.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  Buka Undangan &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setUnpublishModalOpen(true)}
                  disabled={isUnpublishing}
                  className="py-2 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted hover:text-danger rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batalkan Publikasi
                </button>
              </>
            )}

            {/* Switch Tampilan Pratinjau di Layar Desktop */}
            <button
              type="button"
              onClick={() => setShowPreviewDesktop(!showPreviewDesktop)}
              className="hidden lg:inline-flex py-2 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"
            >
              {showPreviewDesktop ? 'Sembunyikan Preview' : 'Tampilkan Preview'}
            </button>

            {/* Tombol Hapus */}
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isDeleting}
              className="py-2 px-3 bg-surface hover:bg-danger/10 border border-border hover:border-danger/30 text-xs font-semibold text-danger rounded transition-colors cursor-pointer disabled:opacity-50"
              title="Hapus Undangan"
            >
              Hapus
            </button>
          </div>
        </div>

        {/* Notifikasi Status Penyimpanan */}
        {saveSuccessMessage && (
          <div
            role="status"
            className="p-3 bg-success/10 border border-success/30 rounded text-xs text-success font-medium flex items-center justify-between"
          >
            <span>{saveSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="text-success hover:underline text-xs"
            >
              Tutup
            </button>
          </div>
        )}

        {saveErrorMessage && (
          <div
            role="alert"
            className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium flex items-center justify-between"
          >
            <span>{saveErrorMessage}</span>
            <button
              type="button"
              onClick={() => setSaveErrorMessage(null)}
              className="text-danger hover:underline text-xs"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Banner Khusus Saat Undangan Sudah Terbit */}
        {invitation.status === 'published' && (
          <div className="p-3 bg-surface-elevated border border-border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Tautan Publik:</span>
              <strong className="text-text-primary font-mono font-normal">/i/{invitation.slug}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-1 px-2.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
              >
                {linkCopied ? 'Tautan Disalin!' : 'Salin Tautan'}
              </button>
              <Link
                to={`/i/${invitation.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary-hover transition-colors"
              >
                Lihat Halaman Publik &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Switch Tampilan Khusus Mobile & Tablet (< lg) */}
      <div className="flex lg:hidden bg-surface border border-border rounded p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 text-center rounded transition-colors cursor-pointer ${
            mobileView === 'editor'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Formulir Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 text-center rounded transition-colors cursor-pointer ${
            mobileView === 'preview'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Pratinjau Langsung
        </button>
      </div>

      {/* 2. Grid Ruang Kerja Utama (Editor vs Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Panel Formulir Editor (5 cols atau 12 cols jika preview disembunyikan) */}
        <div
          className={`${
            showPreviewDesktop ? 'lg:col-span-5' : 'lg:col-span-12'
          } ${mobileView === 'preview' ? 'hidden lg:block' : 'block'} space-y-4`}
        >
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            {/* Navigasi Sub-Tab Editor (8 Tab) */}
            <div className="flex border-b border-border bg-surface-elevated text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Pengaturan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cover')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'cover'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Cover {draftCover.enabled ? '✓' : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hero')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'hero'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Hero &amp; Cover
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'content'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Mempelai
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('story')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'story'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Kisah Kami ({draftStory.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'events'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Acara ({draftEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'gallery'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Galeri ({draftGallery.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gift')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'gift'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Hadiah ({draftGiftAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('music')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'music'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Musik {draftMusic.enabled ? '✓' : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'sections'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Seksi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guests')}
                className={`py-3 px-3 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'guests'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                RSVP &amp; Tamu {guestCount > 0 ? `(${guestCount})` : ''}
              </button>
            </div>

            {/* TAB 1: PENGATURAN UMUM */}
            {activeTab === 'settings' && (
              <div className="p-5 space-y-5 text-xs">
                {/* Judul Undangan */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="formTitle" className="font-semibold text-text-primary">
                      Judul Undangan
                    </label>
                    <span className="text-[11px] text-text-subtle font-mono">
                      {draftTitle.length}/120
                    </span>
                  </div>
                  <input
                    id="formTitle"
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    required
                    maxLength={120}
                    placeholder="Contoh: Pernikahan Romeo & Juliet"
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Judul ini tampil sebagai tajuk utama pada sampul undangan.
                  </p>
                </div>

                {/* Slug Tautan Kustom */}
                <div className="space-y-1">
                  <label htmlFor="formSlug" className="font-semibold text-text-primary block">
                    Tautan Kustom (Slug)
                  </label>
                  <div className="flex items-center">
                    <span className="py-2 px-2.5 bg-surface-elevated border border-r-0 border-border rounded-l text-text-muted text-xs font-mono">
                      /i/
                    </span>
                    <input
                      id="formSlug"
                      type="text"
                      value={draftSlug}
                      onChange={(e) =>
                        setDraftSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '')
                        )
                      }
                      required
                      minLength={3}
                      maxLength={60}
                      pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                      placeholder="romeo-juliet"
                      className="flex-1 py-2 px-3 border border-border rounded-r bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-text-subtle">
                    Hanya gunakan huruf kecil, angka, dan tanda hubung (-). Panjang 3 sampai 60 karakter.
                  </p>
                </div>

                {/* Jenis Acara */}
                <div className="space-y-1">
                  <label htmlFor="formEventType" className="font-semibold text-text-primary block">
                    Jenis Acara
                  </label>
                  <select
                    id="formEventType"
                    value={draftEventType}
                    onChange={(e) => setDraftEventType(e.target.value)}
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
                  >
                    <option value="wedding">Pernikahan (Wedding)</option>
                    <option value="engagement">Pertunangan / Lamaran (Engagement)</option>
                    <option value="birthday">Ulang Tahun (Birthday)</option>
                    <option value="reception">Resepsi / Syukuran</option>
                    <option value="event">Acara Khusus / Lainnya</option>
                  </select>
                </div>

                {/* Sakelar Fitur Interaktif */}
                <div className="pt-3 border-t border-border space-y-3">
                  <span className="font-semibold text-text-primary block text-xs">
                    Fitur Interaktif Tamu
                  </span>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftAllowRsvp}
                      onChange={(e) => setDraftAllowRsvp(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-0"
                    />
                    <div>
                      <span className="font-medium text-text-primary block">
                        Konfirmasi Kehadiran (RSVP)
                      </span>
                      <span className="text-[11px] text-text-subtle leading-relaxed block">
                        Izinkan tamu untuk mengonfirmasi kehadiran mereka melalui formulir undangan.
                      </span>
                    </div>
                  </label>

                  {draftAllowRsvp && (
                    <div className="ml-6 p-4 rounded-lg border border-border bg-surface-elevated/40 space-y-4">
                      <div className="border-b border-border/60 pb-2">
                        <span className="font-semibold text-text-primary text-xs block">
                          Pengaturan Detail RSVP
                        </span>
                        <p className="text-[11px] text-text-subtle mt-0.5">
                          Sesuaikan judul, instruksi, batas pax, dan opsi respons formulir RSVP.
                        </p>
                      </div>

                      {/* Judul Formulir RSVP */}
                      <div className="space-y-1">
                        <label htmlFor="rsvpTitleInput" className="font-medium text-text-primary block">
                          Teks Judul RSVP
                        </label>
                        <input
                          id="rsvpTitleInput"
                          type="text"
                          value={draftRsvpTitle}
                          onChange={(e) => setDraftRsvpTitle(e.target.value)}
                          placeholder="Konfirmasi Kehadiran"
                          maxLength={100}
                          className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                        />
                        <p className="text-[11px] text-text-subtle">
                          Teks tajuk seksi RSVP (default: Konfirmasi Kehadiran).
                        </p>
                      </div>

                      {/* Deskripsi / Instruksi RSVP */}
                      <div className="space-y-1">
                        <label htmlFor="rsvpDescInput" className="font-medium text-text-primary block">
                          Teks Deskripsi / Instruksi RSVP
                        </label>
                        <textarea
                          id="rsvpDescInput"
                          rows={2}
                          value={draftRsvpDescription}
                          onChange={(e) => setDraftRsvpDescription(e.target.value)}
                          placeholder="Mohon konfirmasikan kepastian kehadiran Anda untuk kelancaran acara kami."
                          maxLength={300}
                          className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs resize-none"
                        />
                        <p className="text-[11px] text-text-subtle">
                          Pesan pengantar di bawah judul formulir RSVP.
                        </p>
                      </div>

                      {/* Batas Maksimal Tamu per Undangan (Default Pax) */}
                      <div className="space-y-1">
                        <label htmlFor="rsvpMaxPaxInput" className="font-medium text-text-primary block">
                          Batas Maksimal Jumlah Tamu (Pax) Default
                        </label>
                        <input
                          id="rsvpMaxPaxInput"
                          type="number"
                          min={1}
                          max={20}
                          value={draftRsvpMaxPax}
                          onChange={(e) =>
                            setDraftRsvpMaxPax(
                              Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), 20)
                            )
                          }
                          className="w-24 py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                        />
                        <p className="text-[11px] text-text-subtle">
                          Batas maksimal kehadiran yang dapat dipilih tamu umum (tamu tanpa alokasi khusus).
                        </p>
                      </div>

                      {/* Opsi Jawaban & Catatan */}
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <span className="font-medium text-text-primary block">
                          Opsi Respon Tamu
                        </span>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-text-muted">
                            <input
                              type="checkbox"
                              checked={true}
                              disabled={true}
                              className="rounded border-border text-primary cursor-not-allowed opacity-60"
                            />
                            <span>Pilihan &quot;Hadir&quot; &amp; &quot;Tidak Hadir&quot; (Standar wajib)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draftRsvpAllowTentative}
                              onChange={(e) => setDraftRsvpAllowTentative(e.target.checked)}
                              className="rounded border-border text-primary focus:ring-0"
                            />
                            <span className="text-text-primary">
                              Sediakan opsi jawaban &quot;Masih Ragu / Tentatif&quot;
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draftRsvpAllowNotes}
                              onChange={(e) => setDraftRsvpAllowNotes(e.target.checked)}
                              className="rounded border-border text-primary focus:ring-0"
                            />
                            <span className="text-text-primary">
                              Sediakan kolom catatan atau ucapan doa restu dari tamu
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftShowWishes}
                      onChange={(e) => setDraftShowWishes(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-0"
                    />
                    <div>
                      <span className="font-medium text-text-primary block">
                        Buku Ucapan &amp; Doa Tamu
                      </span>
                      <span className="text-[11px] text-text-subtle leading-relaxed block">
                        Tampilkan seksi ucapan selamat dan doa restu dari para tamu undangan.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB: COVER ENVELOPE */}
            {activeTab === 'cover' && (
              <div className="p-5 space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">
                      Sampul Pembuka (Cover Envelope)
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Pengunjung melihat sampul pembuka elegan sebelum masuk ke isi undangan utama.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draftCover.enabled}
                      onChange={(e) =>
                        setDraftCover((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    <span className="ml-2.5 text-xs font-medium text-text-primary">
                      {draftCover.enabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </label>
                </div>

                <div className="space-y-4">
                  {/* Eyebrow */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="coverEyebrow" className="font-semibold text-text-primary block">
                        Teks Eyebrow / Sapaan Atas
                      </label>
                      <span className="text-[11px] text-text-subtle">
                        Maks. 80 karakter
                      </span>
                    </div>
                    <input
                      id="coverEyebrow"
                      type="text"
                      maxLength={80}
                      value={draftCover.eyebrow ?? ''}
                      onChange={(e) =>
                        setDraftCover((prev) => ({ ...prev, eyebrow: e.target.value }))
                      }
                      placeholder="The Wedding Of"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    <p className="text-[11px] text-text-subtle">
                      Default: The Wedding Of
                    </p>
                  </div>

                  {/* Judul Cover */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="coverTitle" className="font-semibold text-text-primary block">
                        Judul Utama Cover
                      </label>
                      <span className="text-[11px] text-text-subtle">
                        Maks. 120 karakter
                      </span>
                    </div>
                    <input
                      id="coverTitle"
                      type="text"
                      maxLength={120}
                      value={draftCover.title ?? ''}
                      onChange={(e) =>
                        setDraftCover((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder={draftHeroCoupleNames || draftTitle || 'Nama Pasangan'}
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    <p className="text-[11px] text-text-subtle">
                      Dikosongkan untuk menggunakan nama pasangan atau judul undangan yang sudah ada secara otomatis.
                    </p>
                  </div>

                  {/* Subtitle Cover */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="coverSubtitle" className="font-semibold text-text-primary block">
                        Subjudul / Keterangan Acara
                      </label>
                      <span className="text-[11px] text-text-subtle">
                        Maks. 200 karakter
                      </span>
                    </div>
                    <input
                      id="coverSubtitle"
                      type="text"
                      maxLength={200}
                      value={draftCover.subtitle ?? ''}
                      onChange={(e) =>
                        setDraftCover((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      placeholder="Contoh: Sabtu, 28 November 2026 • Grand Ballroom"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    <p className="text-[11px] text-text-subtle">
                      Dikosongkan untuk menyusun tanggal dan venue acara utama secara otomatis.
                    </p>
                  </div>

                  {/* Label Tombol Buka Undangan */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="coverButtonLabel" className="font-semibold text-text-primary block">
                        Label Tombol Pembuka
                      </label>
                      <span className="text-[11px] text-text-subtle">
                        Maks. 40 karakter
                      </span>
                    </div>
                    <input
                      id="coverButtonLabel"
                      type="text"
                      maxLength={40}
                      value={draftCover.button_label ?? 'Buka Undangan'}
                      onChange={(e) =>
                        setDraftCover((prev) => ({ ...prev, button_label: e.target.value }))
                      }
                      placeholder="Buka Undangan"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    <p className="text-[11px] text-text-subtle">
                      Tombol yang disentuh tamu untuk memulai animasi pembukaan sampul dan memicu musik latar.
                    </p>
                  </div>

                  {/* URL Gambar Latar Belakang Cover */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="coverBackgroundImageUrl" className="font-semibold text-text-primary block">
                        Tautan Gambar Latar Belakang (Opsional)
                      </label>
                      <span className="text-[11px] text-text-subtle">
                        URL http/https
                      </span>
                    </div>
                    <input
                      id="coverBackgroundImageUrl"
                      type="url"
                      value={draftCover.background_image_url ?? ''}
                      onChange={(e) =>
                        setDraftCover((prev) => ({ ...prev, background_image_url: e.target.value }))
                      }
                      placeholder="https://example.com/foto-sampul.jpg"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    {draftCover.background_image_url && !isValidWebUrl(draftCover.background_image_url) && (
                      <p className="text-[11px] text-danger">
                        Tautan tidak valid. Harap gunakan alamat URL http:// atau https:// tanpa skema berbahaya.
                      </p>
                    )}
                    <p className="text-[11px] text-text-subtle">
                      Jika dikosongkan, tema visual undangan akan menjadi latar belakang mewah tanpa gambar tiruan.
                    </p>
                  </div>

                  {/* Opasitas Lapisan Overlay */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="coverOverlayOpacity" className="font-semibold text-text-primary block">
                        Opasitas Lapisan Gelap (Overlay)
                      </label>
                      <span className="text-xs font-mono font-medium text-text-secondary">
                        {Math.round((draftCover.overlay_opacity ?? 0.4) * 100)}%
                      </span>
                    </div>
                    <input
                      id="coverOverlayOpacity"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={draftCover.overlay_opacity ?? 0.4}
                      onChange={(e) =>
                        setDraftCover((prev) => ({
                          ...prev,
                          overlay_opacity: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[11px] text-text-subtle">
                      Lapisan gelap di atas gambar latar belakang untuk menjaga keterbacaan teks sesuai standar kontras WCAG AA.
                    </p>
                  </div>

                  {/* Tombol Uji / Reset Pratinjau Cover */}
                  <div className="pt-2 flex items-center justify-between p-3 rounded bg-surface-elevated border border-border">
                    <div>
                      <p className="font-medium text-text-primary">Pratinjau Sampul</p>
                      <p className="text-[11px] text-text-muted">
                        Sentuh Buka Undangan pada jendela pratinjau untuk melihat animasi pembukaan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverPreviewResetKey((k) => k + 1)}
                      className="py-1.5 px-3 rounded border border-border bg-surface hover:bg-surface-elevated text-text-primary text-xs font-medium cursor-pointer transition-colors"
                    >
                      Muat Ulang Sampul
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HERO / COVER */}
            {activeTab === 'hero' && (
              <div className="p-5 space-y-5 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="heroHeadline" className="font-semibold text-text-primary block">
                      Headline Utama Cover
                    </label>
                    <span className="text-[11px] text-text-subtle">
                      Opsional
                    </span>
                  </div>
                  <input
                    id="heroHeadline"
                    type="text"
                    value={draftHeroHeadline}
                    onChange={(e) => setDraftHeroHeadline(e.target.value)}
                    placeholder={`Contoh: ${draftTitle || 'The Wedding Celebration'}`}
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Jika dikosongkan, judul undangan di tab Pengaturan akan otomatis digunakan sebagai headline.
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="heroOpeningText" className="font-semibold text-text-primary block">
                    Teks Pembuka / Salam Khidmat
                  </label>
                  <input
                    id="heroOpeningText"
                    type="text"
                    value={draftHeroOpeningText}
                    onChange={(e) => setDraftHeroOpeningText(e.target.value)}
                    placeholder="Contoh: Walimatul 'Ursy atau The Wedding Celebration of"
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Teks bernuansa elegan yang ditampilkan di atas headline atau salam pembuka.
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="heroCoupleNames" className="font-semibold text-text-primary block">
                    Nama Pasangan di Cover
                  </label>
                  <input
                    id="heroCoupleNames"
                    type="text"
                    value={draftHeroCoupleNames}
                    onChange={(e) => setDraftHeroCoupleNames(e.target.value)}
                    placeholder="Contoh: Romeo & Juliet"
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Nama pasangan khusus tampilan cover. Jika dikosongkan, nama kedua mempelai akan otomatis digabungkan.
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="heroLocation" className="font-semibold text-text-primary block">
                    Lokasi Singkat di Cover
                  </label>
                  <input
                    id="heroLocation"
                    type="text"
                    value={draftHeroLocation}
                    onChange={(e) => setDraftHeroLocation(e.target.value)}
                    placeholder="Contoh: Sleman, D.I. Yogyakarta"
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Jika dikosongkan, nama tempat dari agenda acara utama akan digunakan secara otomatis.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: MEMPELAI & TUAN RUMAH */}
            {activeTab === 'content' && (
              <div className="p-5 space-y-6 text-xs">
                {/* Mempelai Pria */}
                <div className="space-y-4 p-4 border border-border rounded bg-surface-elevated/40">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                      Calon Mempelai Pria
                    </h3>
                  </div>

                  {/* Foto Mempelai Pria */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {draftGroomPhotoUrl ? (
                        <img
                          src={draftGroomPhotoUrl}
                          alt="Foto Mempelai Pria"
                          className="w-16 h-16 rounded-full object-cover border border-border shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border border-dashed border-border bg-surface flex items-center justify-center text-text-subtle text-base font-medium select-none">
                          {draftGroomName.trim() ? draftGroomName.trim().charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={groomFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadCouplePhoto('groom', file);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => groomFileInputRef.current?.click()}
                          disabled={isUploadingGroomPhoto}
                          className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border rounded text-[11px] font-semibold text-text-primary transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingGroomPhoto ? 'Mengunggah...' : draftGroomPhotoUrl ? 'Ganti Foto' : 'Unggah Foto'}
                        </button>
                        {draftGroomPhotoUrl ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCouplePhoto('groom')}
                            className="py-1.5 px-2.5 bg-surface hover:bg-red-500/10 border border-border hover:border-red-500/30 rounded text-[11px] font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-text-subtle">
                        JPEG, PNG, WebP maks. 5 MB.
                      </p>
                      {groomPhotoError ? (
                        <p className="text-[11px] text-danger">{groomPhotoError}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="groomName" className="font-medium text-text-primary block">
                        Nama Lengkap / Panggilan
                      </label>
                      <input
                        id="groomName"
                        type="text"
                        value={draftGroomName}
                        onChange={(e) => setDraftGroomName(e.target.value)}
                        placeholder="Contoh: Raden Satria Pratama"
                        className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="groomRole" className="font-medium text-text-primary block">
                        Peran / Sebutan
                      </label>
                      <input
                        id="groomRole"
                        type="text"
                        value={draftGroomRole}
                        onChange={(e) => setDraftGroomRole(e.target.value)}
                        placeholder="Mempelai Pria"
                        className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="groomParents" className="font-medium text-text-primary block">
                      Nama Orang Tua / Informasi Keluarga
                    </label>
                    <input
                      id="groomParents"
                      type="text"
                      value={draftGroomParents}
                      onChange={(e) => setDraftGroomParents(e.target.value)}
                      placeholder="Contoh: Putra pertama dari Bpk. Hartono & Ibu Nurul"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="groomBio" className="font-medium text-text-primary block">
                      Kutipan / Akun Sosial Media
                    </label>
                    <input
                      id="groomBio"
                      type="text"
                      value={draftGroomBio}
                      onChange={(e) => setDraftGroomBio(e.target.value)}
                      placeholder="Contoh: @raden.satria"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>
                </div>

                {/* Mempelai Wanita */}
                <div className="space-y-4 p-4 border border-border rounded bg-surface-elevated/40">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                      Calon Mempelai Wanita
                    </h3>
                  </div>

                  {/* Foto Mempelai Wanita */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {draftBridePhotoUrl ? (
                        <img
                          src={draftBridePhotoUrl}
                          alt="Foto Mempelai Wanita"
                          className="w-16 h-16 rounded-full object-cover border border-border shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border border-dashed border-border bg-surface flex items-center justify-center text-text-subtle text-base font-medium select-none">
                          {draftBrideName.trim() ? draftBrideName.trim().charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={brideFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadCouplePhoto('bride', file);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => brideFileInputRef.current?.click()}
                          disabled={isUploadingBridePhoto}
                          className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border rounded text-[11px] font-semibold text-text-primary transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingBridePhoto ? 'Mengunggah...' : draftBridePhotoUrl ? 'Ganti Foto' : 'Unggah Foto'}
                        </button>
                        {draftBridePhotoUrl ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCouplePhoto('bride')}
                            className="py-1.5 px-2.5 bg-surface hover:bg-red-500/10 border border-border hover:border-red-500/30 rounded text-[11px] font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-text-subtle">
                        JPEG, PNG, WebP maks. 5 MB.
                      </p>
                      {bridePhotoError ? (
                        <p className="text-[11px] text-danger">{bridePhotoError}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="brideName" className="font-medium text-text-primary block">
                        Nama Lengkap / Panggilan
                      </label>
                      <input
                        id="brideName"
                        type="text"
                        value={draftBrideName}
                        onChange={(e) => setDraftBrideName(e.target.value)}
                        placeholder="Contoh: Dewi Larasati Putri"
                        className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="brideRole" className="font-medium text-text-primary block">
                        Peran / Sebutan
                      </label>
                      <input
                        id="brideRole"
                        type="text"
                        value={draftBrideRole}
                        onChange={(e) => setDraftBrideRole(e.target.value)}
                        placeholder="Mempelai Wanita"
                        className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="brideParents" className="font-medium text-text-primary block">
                      Nama Orang Tua / Informasi Keluarga
                    </label>
                    <input
                      id="brideParents"
                      type="text"
                      value={draftBrideParents}
                      onChange={(e) => setDraftBrideParents(e.target.value)}
                      placeholder="Contoh: Putri kedua dari Bpk. Surya & Ibu Ratna"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="brideBio" className="font-medium text-text-primary block">
                      Kutipan / Akun Sosial Media
                    </label>
                    <input
                      id="brideBio"
                      type="text"
                      value={draftBrideBio}
                      onChange={(e) => setDraftBrideBio(e.target.value)}
                      placeholder="Contoh: @dewi.larasati"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>
                </div>

                {/* Pesan Penutup & Kutipan */}
                <div className="space-y-1 pt-2">
                  <label htmlFor="closingNotes" className="font-semibold text-text-primary block">
                    Pesan Penutup atau Doa Singkat
                  </label>
                  <textarea
                    id="closingNotes"
                    rows={4}
                    value={draftClosingNotes}
                    onChange={(e) => setDraftClosingNotes(e.target.value)}
                    placeholder="Contoh: Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kedua mempelai."
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Pesan ini akan ditampilkan pada seksi penutup undangan.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: LINIMASA KISAH CINTA (STORY) */}
            {activeTab === 'story' && (
              <div className="p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      Linimasa Kisah Kami
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      Bagikan momen-momen berharga dalam perjalanan cinta Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateStoryModal}
                    className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>Tambah Momen</span>
                  </button>
                </div>

                {draftStory.length === 0 ? (
                  <div className="py-10 px-4 border border-dashed border-border rounded-lg bg-surface-elevated/30 text-center space-y-3">
                    <p className="text-text-muted font-medium">
                      Belum ada momen kisah yang ditambahkan.
                    </p>
                    <p className="text-[11px] text-text-subtle max-w-sm mx-auto">
                      Tambahkan kisah seperti awal pertemuan, hari lamaran, atau momen tak terlupakan sebelum pernikahan.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateStoryModal}
                      className="py-1.5 px-3.5 bg-surface hover:bg-surface-elevated border border-border font-medium rounded text-text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>+ Tambah Momen Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftStory.map((story, index) => (
                      <div
                        key={story.id}
                        className={`p-3.5 border rounded-lg transition-colors ${
                          story.is_enabled
                            ? 'border-border bg-surface-elevated/40'
                            : 'border-border/60 bg-surface-elevated/10 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-semibold text-text-subtle shrink-0">
                                {index + 1}
                              </span>
                              <h4 className="font-semibold text-text-primary text-xs truncate">
                                {story.title}
                              </h4>
                              {story.date ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted font-medium">
                                  {story.date}
                                </span>
                              ) : null}
                              {!story.is_enabled ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                                  Dinonaktifkan
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                              {story.description}
                            </p>
                          </div>

                          {/* Aksi Story */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStoryEnabled(story.id)}
                              title={story.is_enabled ? 'Sembunyikan momen' : 'Tampilkan momen'}
                              className={`p-1.5 rounded border transition-colors cursor-pointer text-[11px] ${
                                story.is_enabled
                                  ? 'border-border bg-surface text-text-primary hover:bg-surface-elevated'
                                  : 'border-border bg-surface-elevated text-text-subtle'
                              }`}
                            >
                              {story.is_enabled ? 'Aktif' : 'Nonaktif'}
                            </button>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveStoryUp(index)}
                              title="Pindah ke atas"
                              className="p-1.5 rounded border border-border bg-surface hover:bg-surface-elevated disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-[11px]"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={index === draftStory.length - 1}
                              onClick={() => handleMoveStoryDown(index)}
                              title="Pindah ke bawah"
                              className="p-1.5 rounded border border-border bg-surface hover:bg-surface-elevated disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-[11px]"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditStoryModal(story)}
                              title="Edit momen"
                              className="p-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-text-primary cursor-pointer text-[11px]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStoryToDelete(story);
                                setDeleteStoryModalOpen(true);
                              }}
                              title="Hapus momen"
                              className="p-1.5 rounded border border-border bg-surface hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer text-[11px]"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AGENDA ACARA (EVENTS) */}
            {activeTab === 'events' && (
              <div className="p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      Rangkaian Acara
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      Kelola jadwal akad, pemberkatan, resepsi, atau perayaan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateEventModal}
                    className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Tambah Acara
                  </button>
                </div>

                {draftEvents.length === 0 ? (
                  <div className="p-8 border border-dashed border-border rounded text-center space-y-2">
                    <p className="text-text-muted">
                      Belum ada rangkaian acara yang ditambahkan.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateEventModal}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Tambah Acara Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftEvents.map((evt) => {
                      const startDate = new Date(evt.start_time);
                      const isDateValid = !isNaN(startDate.getTime());
                      const dateStr = isDateValid
                        ? startDate.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : evt.start_time;

                      const timeStr = isDateValid
                        ? startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      let timeDisplay = timeStr;
                      if (evt.end_time) {
                        const endDate = new Date(evt.end_time);
                        if (!isNaN(endDate.getTime())) {
                          timeDisplay = `${timeStr} - ${endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                        }
                      }

                      return (
                        <div
                          key={evt.id}
                          className="p-3.5 border border-border rounded bg-surface hover:bg-surface-elevated/40 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-text-primary">
                                  {evt.title}
                                </h4>
                                {evt.is_primary ? (
                                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded border border-success/30 bg-success/10 text-success">
                                    Acara Utama
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryEvent(evt)}
                                    className="text-[10px] text-text-muted hover:text-text-primary underline cursor-pointer"
                                  >
                                    Jadikan Utama
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-text-muted pt-0.5">
                                {dateStr} {timeDisplay && `• ${timeDisplay} ${evt.timezone}`}
                              </p>
                              <p className="text-[11px] text-text-primary font-medium pt-0.5">
                                {evt.venue_name}
                              </p>
                              {evt.address && (
                                <p className="text-[11px] text-text-subtle">
                                  {evt.address}
                                </p>
                              )}
                              {evt.maps_url && (
                                <a
                                  href={evt.maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 pt-0.5"
                                >
                                  Tautan Google Maps &rarr;
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEventModal(evt)}
                                className="py-1 px-2 text-[11px] border border-border rounded bg-surface hover:bg-surface-elevated text-text-primary font-medium transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEventToDelete(evt);
                                  setDeleteEventModalOpen(true);
                                }}
                                className="py-1 px-2 text-[11px] border border-border rounded bg-surface hover:bg-danger/10 hover:border-danger/30 text-danger font-medium transition-colors cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: GALERI FOTO (GALLERY) */}
            {activeTab === 'gallery' && (
              <div className="p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">
                      Galeri Foto
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      Dokumentasi foto momen kebahagiaan yang tampil pada halaman undangan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenUploadModal}
                    className="py-2 px-3.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer whitespace-nowrap min-h-[38px] flex items-center gap-1.5 shadow-xs"
                  >
                    <span>+</span> Unggah Foto
                  </button>
                </div>

                {/* Status Storage Information */}
                <div className="p-3 bg-surface-elevated border border-border rounded text-[11px] text-text-muted leading-relaxed flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0 mt-0.5">&bull;</span>
                  <div>
                    <strong className="text-text-primary font-medium">Penyimpanan Terintegrasi:</strong> Foto diunggah langsung ke Supabase Storage bucket <code className="font-mono text-text-primary">invitation-gallery</code> dengan struktur tenant-safe. Format didukung: JPG, PNG, WebP (maks. 5 MB per foto, maksimal 5 foto per batch).
                  </div>
                </div>

                {draftGallery.length === 0 ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                      if (e.dataTransfer.files) {
                        handleOpenUploadModal();
                        handleSelectFiles(e.dataTransfer.files);
                      }
                    }}
                    className={`p-8 border-2 border-dashed rounded-lg text-center space-y-3 transition-colors ${
                      isDraggingOver
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted text-lg">
                      &#128247;
                    </div>
                    <div>
                      <p className="text-text-primary font-medium text-xs">
                        Belum ada foto yang diunggah ke galeri
                      </p>
                      <p className="text-text-subtle text-[11px] mt-0.5">
                        Tarik dan lepaskan foto ke area ini, atau klik tombol di bawah untuk memilih berkas.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleOpenUploadModal}
                        className="py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        + Unggah Foto Pertama
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header kontrol & total */}
                    <div className="flex items-center justify-between text-[11px] text-text-subtle px-1">
                      <span>Total {draftGallery.length} foto dalam galeri</span>
                      <span>Format display: Grid responsif</span>
                    </div>

                    <div className="space-y-2.5">
                      {draftGallery.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3 border border-border rounded-lg bg-surface hover:bg-surface-elevated/40 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Tombol Urutan */}
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryUp(index)}
                                disabled={index === 0}
                                aria-label="Pindahkan foto ke atas"
                                className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-border rounded text-xs bg-surface hover:bg-surface-elevated transition-colors"
                              >
                                &uarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryDown(index)}
                                disabled={index === draftGallery.length - 1}
                                aria-label="Pindahkan foto ke bawah"
                                className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-border rounded text-xs bg-surface hover:bg-surface-elevated transition-colors"
                              >
                                &darr;
                              </button>
                            </div>

                            {/* Thumbnail Foto */}
                            <img
                              src={getGalleryPublicUrl(item.storage_path)}
                              alt={item.caption || 'Foto galeri'}
                              className="w-14 h-14 object-cover rounded border border-border bg-surface-elevated shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f5f4f0" width="100" height="100"/><text fill="%2378716c" font-size="12" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Gambar</text></svg>';
                              }}
                            />

                            <div className="truncate min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-text-subtle">
                                  #{index + 1}
                                </span>
                                {item.width && item.height ? (
                                  <span className="text-[10px] bg-surface-elevated text-text-muted px-1.5 py-0.5 rounded font-mono border border-border">
                                    {item.width} &times; {item.height} px
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-text-primary font-medium truncate mt-0.5">
                                {item.caption || 'Tanpa keterangan foto'}
                              </p>
                              <p className="text-[10px] text-text-subtle font-mono truncate max-w-[260px]">
                                {item.storage_path}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGalleryModal(item)}
                              className="py-1.5 px-2.5 text-xs border border-border rounded bg-surface hover:bg-surface-elevated text-text-primary font-medium transition-colors cursor-pointer min-h-[32px]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGalleryToDelete(item);
                                setDeleteGalleryErrorMessage(null);
                                setDeleteGalleryModalOpen(true);
                              }}
                              className="py-1.5 px-2.5 text-xs border border-border rounded bg-surface hover:bg-danger/10 hover:border-danger/30 text-danger font-medium transition-colors cursor-pointer min-h-[32px]"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={handleOpenUploadModal}
                        className="py-2 px-4 border border-dashed border-border hover:border-primary rounded-lg text-text-muted hover:text-primary text-xs font-semibold transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 bg-surface"
                      >
                        + Tambah Foto Lainnya ke Galeri
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PENGELOLAAN HADIAH & AMPLOP DIGITAL */}
            {activeTab === 'gift' && (
              <div className="p-5 space-y-6 text-xs">
                {/* 1. Pengaturan Utama Fitur Hadiah */}
                <div className="p-4 border border-border rounded bg-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                        Fitur Tanda Kasih / Amplop Digital
                      </h3>
                      <p className="text-[11px] text-text-subtle mt-0.5">
                        Izinkan kerabat dan sahabat mengirimkan tanda kasih berupa transfer bank, e-wallet, atau kado fisik.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={draftGiftEnabled}
                        onChange={(e) => setDraftGiftEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-elevated border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-subtle peer-checked:after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {draftGiftEnabled && (
                    <div className="pt-3 border-t border-border/50 space-y-3">
                      <div className="space-y-1">
                        <label htmlFor="gift-title-input" className="font-medium text-text-primary block">
                          Judul Seksi Hadiah
                        </label>
                        <input
                          id="gift-title-input"
                          type="text"
                          value={draftGiftTitle}
                          onChange={(e) => setDraftGiftTitle(e.target.value)}
                          placeholder="Kirim Hadiah"
                          maxLength={60}
                          className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="gift-desc-input" className="font-medium text-text-primary block">
                          Pesan Pengantar / Instruksi
                        </label>
                        <textarea
                          id="gift-desc-input"
                          rows={2}
                          value={draftGiftDescription}
                          onChange={(e) => setDraftGiftDescription(e.target.value)}
                          placeholder="Tuliskan ucapan atau pengantar untuk para tamu..."
                          maxLength={300}
                          className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Daftar Rekening Bank & E-Wallet */}
                {draftGiftEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                          Rekening Bank &amp; Dompet Digital ({draftGiftAccounts.length})
                        </h3>
                        <p className="text-[11px] text-text-subtle mt-0.5">
                          Tamu dapat langsung menyalin nomor rekening dengan satu klik.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenAddGiftAccountModal}
                        className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        + Tambah Rekening
                      </button>
                    </div>

                    {draftGiftAccounts.length === 0 ? (
                      <div className="p-8 border border-dashed border-border rounded text-center space-y-2">
                        <p className="text-xs text-text-muted font-medium">
                          Belum ada rekening atau dompet digital yang ditambahkan.
                        </p>
                        <p className="text-[11px] text-text-subtle">
                          Tambahkan nomor rekening BCA, Mandiri, BRI, BNI, GoPay, OVO, atau lainnya.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {draftGiftAccounts.map((acc, index) => (
                          <div
                            key={acc.id}
                            className={`p-3.5 border rounded bg-surface transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              acc.is_enabled ? 'border-border' : 'border-border/60 opacity-60 bg-surface-elevated/20'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-primary text-xs">
                                  {acc.provider}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-surface-elevated text-text-subtle font-medium uppercase">
                                  {acc.type === 'ewallet' ? 'E-Wallet' : 'Bank'}
                                </span>
                                {acc.label ? (
                                  <span className="text-[11px] text-text-muted">
                                    ({acc.label})
                                  </span>
                                ) : null}
                              </div>
                              <div className="font-mono text-xs font-bold text-text-primary tracking-wider">
                                {acc.account_number}
                              </div>
                              {acc.holder_name ? (
                                <div className="text-[11px] text-text-subtle">
                                  a.n. {acc.holder_name}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {/* Urutan Naik / Turun */}
                              <div className="flex items-center border border-border rounded overflow-hidden mr-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveGiftAccountUp(index)}
                                  disabled={index === 0}
                                  className="py-1 px-2 text-[11px] hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-text-muted"
                                  title="Pindah ke atas"
                                >
                                  &uarr;
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveGiftAccountDown(index)}
                                  disabled={index === draftGiftAccounts.length - 1}
                                  className="py-1 px-2 text-[11px] hover:bg-surface-elevated transition-colors cursor-pointer border-l border-border disabled:opacity-30 disabled:cursor-not-allowed text-text-muted"
                                  title="Pindah ke bawah"
                                >
                                  &darr;
                                </button>
                              </div>

                              {/* Toggle Aktif / Nonaktif */}
                              <button
                                type="button"
                                onClick={() => handleToggleGiftAccountEnabled(acc.id)}
                                className={`py-1 px-2.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                                  acc.is_enabled
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : 'border-border bg-surface text-text-subtle'
                                }`}
                              >
                                {acc.is_enabled ? 'Aktif' : 'Nonaktif'}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditGiftAccountModal(acc)}
                                className="py-1 px-2 rounded text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                              >
                                Edit
                              </button>

                              {/* Hapus */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAccountToDelete(acc);
                                  setDeleteGiftAccountModalOpen(true);
                                }}
                                className="py-1 px-2 rounded text-xs font-semibold text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Pengiriman Hadiah Fisik */}
                {draftGiftEnabled && (
                  <div className="p-4 border border-border rounded bg-surface space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                          Alamat Pengiriman Kado Fisik
                        </h3>
                        <p className="text-[11px] text-text-subtle mt-0.5">
                          Tampilkan alamat rumah bagi tamu yang ingin mengirimkan kado fisik via kurir atau pos.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={draftGiftAddress.is_enabled}
                          onChange={(e) =>
                            setDraftGiftAddress((prev) => ({ ...prev, is_enabled: e.target.checked }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-elevated border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-subtle peer-checked:after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {draftGiftAddress.is_enabled && (
                      <div className="pt-3 border-t border-border/50 space-y-3">
                        <div className="space-y-1">
                          <label htmlFor="gift-recipient-name" className="font-medium text-text-primary block">
                            Nama Penerima
                          </label>
                          <input
                            id="gift-recipient-name"
                            type="text"
                            value={draftGiftAddress.recipient_name}
                            onChange={(e) =>
                              setDraftGiftAddress((prev) => ({ ...prev, recipient_name: e.target.value }))
                            }
                            placeholder="Contoh: Romeo & Juliet"
                            maxLength={100}
                            className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="gift-address-text" className="font-medium text-text-primary block">
                            Alamat Lengkap Pengiriman
                          </label>
                          <textarea
                            id="gift-address-text"
                            rows={3}
                            value={draftGiftAddress.address}
                            onChange={(e) =>
                              setDraftGiftAddress((prev) => ({ ...prev, address: e.target.value }))
                            }
                            placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, kode pos"
                            maxLength={300}
                            className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="gift-phone-input" className="font-medium text-text-primary block">
                              Nomor Telepon / WhatsApp (Opsional)
                            </label>
                            <input
                              id="gift-phone-input"
                              type="text"
                              value={draftGiftAddress.phone || ''}
                              onChange={(e) =>
                                setDraftGiftAddress((prev) => ({ ...prev, phone: e.target.value }))
                              }
                              placeholder="081234567890"
                              maxLength={30}
                              className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="gift-notes-input" className="font-medium text-text-primary block">
                              Catatan Pengiriman (Opsional)
                            </label>
                            <input
                              id="gift-notes-input"
                              type="text"
                              value={draftGiftAddress.notes || ''}
                              onChange={(e) =>
                                setDraftGiftAddress((prev) => ({ ...prev, notes: e.target.value }))
                              }
                              placeholder="Contoh: Titipkan ke satpam perumahan"
                              maxLength={100}
                              className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PENGATURAN MUSIK LATAR */}
            {activeTab === 'music' && (
              <div className="p-5 space-y-5 text-xs">
                {/* Header Tab & Sakelar Aktif */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">
                      Pengaturan Musik Latar
                    </h3>
                    <p className="text-text-muted mt-0.5">
                      Atur alunan musik pengiring yang akan diputar sebagai latar saat undangan dibuka.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0" aria-label="Sakelar aktifkan musik latar">
                    <input
                      type="checkbox"
                      checked={draftMusic.enabled}
                      onChange={(e) => {
                        const nextEnabled = e.target.checked;
                        setDraftMusic((prev) => ({ ...prev, enabled: nextEnabled }));
                        if (!nextEnabled && musicPreviewPlaying && musicPreviewAudio) {
                          musicPreviewAudio.pause();
                          setMusicPreviewPlaying(false);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-elevated border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-subtle peer-checked:after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {draftMusic.enabled ? (
                  <div className="space-y-4">
                    {/* Tautan Audio (URL) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="music-audio-url" className="font-semibold text-text-primary">
                          Tautan Berkas Audio (URL) <span className="text-danger">*</span>
                        </label>
                        {draftMusic.audio_url && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              isValidAudioUrl(draftMusic.audio_url)
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-danger/30 bg-danger/10 text-danger'
                            }`}
                          >
                            {isValidAudioUrl(draftMusic.audio_url) ? 'URL Valid' : 'Format Tidak Didukung'}
                          </span>
                        )}
                      </div>
                      <input
                        id="music-audio-url"
                        type="url"
                        required
                        value={draftMusic.audio_url}
                        onChange={(e) => {
                          setDraftMusic((prev) => ({ ...prev, audio_url: e.target.value }));
                          setMusicPreviewError(null);
                        }}
                        placeholder="Contoh: https://assets.example.com/audio/wedding-melody.mp3"
                        className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                      />
                      <p className="text-[11px] text-text-subtle">
                        Gunakan tautan langsung ke berkas audio (format .mp3 atau .aac) dengan protokol https://.
                      </p>
                    </div>

                    {/* Judul / Label Lagu (Opsional) */}
                    <div className="space-y-1">
                      <label htmlFor="music-title" className="font-semibold text-text-primary block">
                        Judul / Label Lagu (Opsional)
                      </label>
                      <input
                        id="music-title"
                        type="text"
                        maxLength={100}
                        value={draftMusic.title || ''}
                        onChange={(e) => setDraftMusic((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Contoh: Canon in D - Johann Pachelbel"
                        className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                      />
                      <p className="text-[11px] text-text-subtle">
                        Judul ini akan ditampilkan pada widget pemutar musik di halaman undangan tamu.
                      </p>
                    </div>

                    {/* Panel Uji Coba Audio (Live Preview Audio di Dashboard) */}
                    <div className="p-3.5 bg-surface-elevated border border-border rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary text-xs">
                          Uji Coba Pemutaran Audio
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {musicPreviewPlaying ? 'Sedang Diputar' : 'Dijeda'}
                        </span>
                      </div>

                      {musicPreviewError && (
                        <div className="p-2.5 bg-danger/10 border border-danger/30 rounded text-[11px] text-danger">
                          {musicPreviewError}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!isValidAudioUrl(draftMusic.audio_url)}
                          onClick={handleToggleMusicPreview}
                          className={`py-1.5 px-3.5 rounded text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                            musicPreviewPlaying
                              ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                              : 'bg-primary text-primary-foreground border-primary hover:bg-primary-hover'
                          }`}
                        >
                          {musicPreviewPlaying ? (
                            <>
                              <span>&#10074;&#10074;</span>
                              <span>Hentikan Pratinjau</span>
                            </>
                          ) : (
                            <>
                              <span>&#9658;</span>
                              <span>Uji Putar Musik</span>
                            </>
                          )}
                        </button>

                        <span className="text-[11px] text-text-subtle">
                          Pastikan audio dapat terdengar sebelum menyimpan perubahan.
                        </span>
                      </div>
                    </div>

                    {/* Pengaturan Pemutaran: Autoplay & Loop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 border border-border rounded bg-surface space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            id="music-autoplay"
                            type="checkbox"
                            checked={draftMusic.autoplay}
                            onChange={(e) => setDraftMusic((prev) => ({ ...prev, autoplay: e.target.checked }))}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <label htmlFor="music-autoplay" className="font-semibold text-text-primary text-xs cursor-pointer select-none">
                            Putar Otomatis (Autoplay)
                          </label>
                        </div>
                        <p className="text-[11px] text-text-subtle pl-5 leading-relaxed">
                          Mencoba memutar audio saat halaman terbuka (mengikuti kebijakan browser tamu).
                        </p>
                      </div>

                      <div className="p-3 border border-border rounded bg-surface space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            id="music-loop"
                            type="checkbox"
                            checked={draftMusic.loop}
                            onChange={(e) => setDraftMusic((prev) => ({ ...prev, loop: e.target.checked }))}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <label htmlFor="music-loop" className="font-semibold text-text-primary text-xs cursor-pointer select-none">
                            Putar Berulang (Loop)
                          </label>
                        </div>
                        <p className="text-[11px] text-text-subtle pl-5 leading-relaxed">
                          Memutar kembali lagu dari awal secara berulang saat durasi selesai.
                        </p>
                      </div>
                    </div>

                    {/* Tingkat Volume */}
                    <div className="space-y-1.5 p-3 border border-border rounded bg-surface">
                      <div className="flex items-center justify-between">
                        <label htmlFor="music-volume" className="font-semibold text-text-primary text-xs">
                          Tingkat Volume Awal
                        </label>
                        <span className="font-mono text-xs font-semibold text-text-primary">
                          {Math.round(draftMusic.volume * 100)}%
                        </span>
                      </div>
                      <input
                        id="music-volume"
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={Math.round(draftMusic.volume * 100)}
                        onChange={(e) => {
                          const val = Number(e.target.value) / 100;
                          setDraftMusic((prev) => ({ ...prev, volume: val }));
                          if (musicPreviewAudio) {
                            musicPreviewAudio.volume = val;
                          }
                        }}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-text-subtle">
                        <span>Senyap (0%)</span>
                        <span>Sedang (50%)</span>
                        <span>Maksimal (100%)</span>
                      </div>
                    </div>

                    {/* Tombol Reset / Nonaktifkan */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (musicPreviewAudio) {
                            musicPreviewAudio.pause();
                            setMusicPreviewPlaying(false);
                          }
                          setDraftMusic({
                            ...DEFAULT_MUSIC_CONFIG,
                          });
                          setMusicPreviewError(null);
                        }}
                        className="py-1.5 px-3 border border-danger/30 text-danger hover:bg-danger/10 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        Hapus / Reset Konfigurasi Musik
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-border rounded text-center space-y-2">
                    <p className="font-medium text-text-primary">Fitur Musik Latar Dinonaktifkan</p>
                    <p className="text-text-subtle text-[11px] max-w-sm mx-auto">
                      Aktifkan sakelar di kanan atas untuk menyematkan musik pengiring pada undangan publik Anda.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: KELOLA SEKSI */}
            {activeTab === 'sections' && (
              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <h3 className="font-semibold text-text-primary">
                    Tata Letak &amp; Urutan Seksi
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Atur seksi yang tampil pada halaman undangan. Perubahan posisi atau status aktif dapat dipratinjau langsung di sisi kanan.
                  </p>
                </div>

                {draftSections.length === 0 ? (
                  <div className="p-4 border border-dashed border-border rounded text-center text-text-muted">
                    Seksi belum diinisialisasi dari template master.
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border rounded overflow-hidden">
                    {draftSections.map((section, index) => {
                      const meta = SECTION_METADATA[section.section_type] || {
                        label: section.section_type,
                        description: 'Seksi kustom undangan',
                      };

                      return (
                        <div
                          key={section.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-elevated transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Tombol Urutan Atas / Bawah */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveSectionUp(index)}
                                disabled={index === 0}
                                aria-label={`Pindahkan seksi ${meta.label} ke atas`}
                                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-border rounded text-[10px] bg-surface"
                              >
                                &uarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSectionDown(index)}
                                disabled={index === draftSections.length - 1}
                                aria-label={`Pindahkan seksi ${meta.label} ke bawah`}
                                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-border rounded text-[10px] bg-surface"
                              >
                                &darr;
                              </button>
                            </div>

                            <span className="font-mono text-text-subtle text-[11px] w-5">
                              #{index + 1}
                            </span>

                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-text-primary">
                                  {meta.label}
                                </span>
                                <span
                                  className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded border ${
                                    section.is_enabled
                                      ? 'border-success/30 bg-success/10 text-success'
                                      : 'border-border bg-surface-elevated text-text-subtle'
                                  }`}
                                >
                                  {section.is_enabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-subtle truncate">
                                {meta.description}
                              </p>
                            </div>
                          </div>

                          {/* Tombol Sakelar Aktif/Nonaktif */}
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={section.is_enabled}
                              onChange={() => handleToggleSection(section.id)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-surface-elevated border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-subtle peer-checked:after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: PENGELOLAAN TAMU & RSVP */}
            {activeTab === 'guests' && (
              <GuestManagementTab
                invitationId={invitation.id}
                invitationSlug={invitation.slug}
                invitationTitle={invitation.title}
                onGuestCountChange={setGuestCount}
              />
            )}
          </div>
        </div>

        {/* Kolom Kanan: Panel Pratinjau Desain Langsung (Live Preview) */}
        {showPreviewDesktop && (
          <div
            className={`lg:col-span-7 ${
              mobileView === 'editor' ? 'hidden lg:block' : 'block'
            } space-y-3 sticky top-6`}
          >
            <div className="border border-border rounded overflow-hidden shadow-sm bg-background">
              {/* Header Panel Pratinjau */}
              <div className="py-2.5 px-4 bg-surface-elevated border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    Pratinjau Langsung
                  </span>
                  <span className="px-2 py-0.5 rounded border border-border bg-surface text-[10px] uppercase font-semibold text-text-muted">
                    {previewConfig?.template?.name ?? 'Classic Elegance'}
                  </span>
                </div>

                {/* Sakelar Tampilan Lebar Desktop vs Ponsel */}
                <div className="flex items-center gap-1 bg-surface border border-border rounded p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`py-0.5 px-2 rounded transition-colors cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Layar Lebar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`py-0.5 px-2 rounded transition-colors cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Layar Ponsel
                  </button>
                </div>
              </div>

              {/* Area Renderer Undangan (Responsif terhadap draft lokal acara dan galeri) */}
              <div
                className={`max-h-[720px] overflow-y-auto ${
                  previewDevice === 'mobile' ? 'p-6 flex justify-center bg-surface-elevated/60' : ''
                }`}
              >
                <div
                  className={
                    previewDevice === 'mobile'
                      ? 'w-[390px] border border-border rounded-xl overflow-hidden shadow-md bg-background'
                      : 'w-full'
                  }
                >
                  {liveInvitation ? (
                    <InvitationRenderer
                      key={coverPreviewResetKey}
                      invitation={liveInvitation}
                      template={previewConfig?.template}
                      customSections={draftSections}
                      content={liveContent}
                      events={draftEvents}
                      gallery={draftGallery}
                      mode="editor"
                      previewCover={activeTab === 'cover' && draftCover.enabled}
                    />
                  ) : (
                    <div className="py-24 text-center text-xs text-text-muted">
                      Menyiapkan pratinjau...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal Tambah / Edit Acara */}
      {eventModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl font-bold text-primary">
              {editingEventId ? 'Edit Rangkaian Acara' : 'Tambah Rangkaian Acara'}
            </h2>

            {eventErrorMessage && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {eventErrorMessage}
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="evtTitle" className="font-semibold text-text-primary block">
                  Nama / Jenis Acara
                </label>
                <input
                  id="evtTitle"
                  type="text"
                  required
                  maxLength={100}
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Contoh: Akad Nikah / Pemberkatan / Resepsi"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="evtStartTime" className="font-semibold text-text-primary block">
                    Waktu Mulai
                  </label>
                  <input
                    id="evtStartTime"
                    type="datetime-local"
                    required
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="evtEndTime" className="font-semibold text-text-primary block">
                    Waktu Selesai (Opsional)
                  </label>
                  <input
                    id="evtEndTime"
                    type="datetime-local"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="evtTimezone" className="font-semibold text-text-primary block">
                  Zona Waktu
                </label>
                <select
                  id="evtTimezone"
                  value={eventForm.timezone}
                  onChange={(e) => setEventForm({ ...eventForm, timezone: e.target.value })}
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
                >
                  <option value="Asia/Jakarta">WIB (Waktu Indonesia Barat / Asia/Jakarta)</option>
                  <option value="Asia/Makassar">WITA (Waktu Indonesia Tengah / Asia/Makassar)</option>
                  <option value="Asia/Jayapura">WIT (Waktu Indonesia Timur / Asia/Jayapura)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="evtVenue" className="font-semibold text-text-primary block">
                  Nama Tempat / Gedung / Lokasi
                </label>
                <input
                  id="evtVenue"
                  type="text"
                  required
                  value={eventForm.venue_name}
                  onChange={(e) => setEventForm({ ...eventForm, venue_name: e.target.value })}
                  placeholder="Contoh: Masjid Agung Al-Azhar / Sasana Kriya TMII"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="evtAddress" className="font-semibold text-text-primary block">
                  Alamat Lengkap (Opsional)
                </label>
                <textarea
                  id="evtAddress"
                  rows={2}
                  value={eventForm.address}
                  onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                  placeholder="Contoh: Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="evtMapsUrl" className="font-semibold text-text-primary block">
                  Tautan Google Maps (Opsional)
                </label>
                <input
                  id="evtMapsUrl"
                  type="url"
                  value={eventForm.maps_url}
                  onChange={(e) => setEventForm({ ...eventForm, maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.is_primary}
                    onChange={(e) => setEventForm({ ...eventForm, is_primary: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-0"
                  />
                  <span className="font-medium text-text-primary">
                    Jadikan sebagai Acara Utama (Primary Event)
                  </span>
                </label>
                <p className="text-[11px] text-text-subtle pt-1">
                  Acara utama akan ditampilkan pada sampul depan (Hero) dan menjadi penanggalan utama undangan.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  disabled={isSavingEvent}
                  className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingEvent ? 'Menyimpan...' : 'Simpan Acara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Hapus Acara */}
      {deleteEventModalOpen && eventToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-danger">
              Hapus Acara Ini?
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Acara <strong className="text-text-primary">{eventToDelete.title}</strong> akan dihapus dari daftar rangkaian acara. Undangan utama Anda tidak akan terhapus.
            </p>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteEventModalOpen(false);
                  setEventToDelete(null);
                }}
                disabled={isDeletingEvent}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                disabled={isDeletingEvent}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingEvent ? 'Menghapus...' : 'Ya, Hapus Acara'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4a. Modal Tambah / Edit Kisah Cinta */}
      {storyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-text-primary text-sm">
                {editingStoryId ? 'Edit Momen Kisah' : 'Tambah Momen Kisah'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setStoryModalOpen(false);
                  setStoryErrorMessage(null);
                }}
                aria-label="Tutup modal"
                className="text-text-muted hover:text-text-primary p-1 rounded cursor-pointer"
              >
                &times;
              </button>
            </div>

            {storyErrorMessage && (
              <div role="alert" className="p-2.5 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium">
                {storyErrorMessage}
              </div>
            )}

            <form onSubmit={handleSaveStory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label htmlFor="storyTitle" className="font-medium text-text-primary block">
                  Judul Momen <span className="text-danger">*</span>
                </label>
                <input
                  id="storyTitle"
                  type="text"
                  value={storyForm.title}
                  onChange={(e) => setStoryForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Pertama Kali Bertemu"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="storyDate" className="font-medium text-text-primary block">
                  Waktu / Tahun (Opsional)
                </label>
                <input
                  id="storyDate"
                  type="text"
                  value={storyForm.date}
                  onChange={(e) => setStoryForm((prev) => ({ ...prev, date: e.target.value }))}
                  placeholder="Contoh: 14 Februari 2020 atau Tahun 2020"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="storyDescription" className="font-medium text-text-primary block">
                  Isi Cerita Momen <span className="text-danger">*</span>
                </label>
                <textarea
                  id="storyDescription"
                  rows={4}
                  value={storyForm.description}
                  onChange={(e) => setStoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ceritakan kisah indah pada momen ini secara singkat dan berkesan..."
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setStoryModalOpen(false);
                    setStoryErrorMessage(null);
                  }}
                  className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  Simpan Momen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4b. Modal Konfirmasi Hapus Kisah */}
      {deleteStoryModalOpen && storyToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-text-primary text-sm">
              Hapus Momen Kisah?
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Apakah Anda yakin ingin menghapus momen &ldquo;{storyToDelete.title}&rdquo; dari linimasa kisah perjalanan?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setDeleteStoryModalOpen(false);
                  setStoryToDelete(null);
                }}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStory}
                className="py-1.5 px-3.5 bg-danger hover:bg-danger-hover text-white text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Unggah Foto Galeri */}
      {uploadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-primary">
                Unggah Foto Galeri
              </h2>
              <button
                type="button"
                onClick={handleCloseUploadModal}
                disabled={isUploading}
                aria-label="Tutup modal"
                className="text-text-muted hover:text-text-primary p-1 rounded cursor-pointer disabled:opacity-40"
              >
                &times;
              </button>
            </div>

            {uploadErrorMessage && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {uploadErrorMessage}
              </div>
            )}

            {/* Input Berkas Tersembunyi */}
            <input
              ref={galleryFileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files) {
                  handleSelectFiles(e.target.files);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />

            {/* Area Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files) {
                  handleSelectFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                if (!isUploading) galleryFileInputRef.current?.click();
              }}
              className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                isDraggingOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface-elevated/40 hover:bg-surface-elevated'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="space-y-1.5">
                <p className="text-xs text-text-primary font-medium">
                  Tarik berkas foto ke sini atau <span className="text-primary underline">klik untuk memilih</span>
                </p>
                <p className="text-[11px] text-text-subtle">
                  Format didukung: JPG, PNG, atau WebP. Maksimal 5 MB per berkas.
                </p>
              </div>
            </div>

            {/* Daftar Berkas Siap Diunggah */}
            {stagedFiles.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-semibold text-text-primary">
                    Foto yang Dipilih ({stagedFiles.length}/5):
                  </span>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => setStagedFiles([])}
                      className="text-[11px] text-danger hover:underline cursor-pointer"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {stagedFiles.map((staged, idx) => (
                    <div
                      key={staged.id}
                      className="p-2.5 border border-border rounded-lg bg-surface flex items-start gap-3"
                    >
                      <img
                        src={staged.previewUrl}
                        alt="Pratinjau"
                        className="w-12 h-12 object-cover rounded border border-border bg-surface-elevated shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-text-primary font-medium truncate">
                            {staged.file.name}
                          </p>
                          <span className="text-[10px] text-text-subtle font-mono shrink-0">
                            {staged.sizeFormatted}
                          </span>
                        </div>

                        <input
                          type="text"
                          maxLength={200}
                          disabled={isUploading}
                          value={staged.caption}
                          onChange={(e) => handleUpdateStagedCaption(staged.id, e.target.value)}
                          placeholder={`Keterangan foto #${idx + 1} (opsional)`}
                          className="w-full py-1 px-2 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-[11px]"
                        />
                      </div>

                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedFile(staged.id)}
                          aria-label="Batalkan foto ini"
                          className="text-text-muted hover:text-danger p-1 text-sm cursor-pointer shrink-0"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Pengunggahan (Loading State Jujur Tanpa Fake Progress) */}
            {isUploading && uploadProgress && (
              <div className="p-3 bg-surface-elevated border border-border rounded-lg flex items-center gap-3 text-xs">
                <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium">
                    Mengunggah foto {uploadProgress.current} dari {uploadProgress.total}...
                  </p>
                  <p className="text-[11px] text-text-subtle truncate">
                    {uploadProgress.fileName}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseUploadModal}
                disabled={isUploading}
                className="py-1.5 px-3.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={isUploading || stagedFiles.length === 0}
                className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50 min-h-[36px] flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <span>Unggah {stagedFiles.length > 0 ? `${stagedFiles.length} Foto` : ''}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5b. Modal Edit Keterangan Foto */}
      {editGalleryModalOpen && editingGalleryItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-primary">
              Edit Keterangan Foto
            </h2>

            {editGalleryErrorMessage && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {editGalleryErrorMessage}
              </div>
            )}

            <form onSubmit={handleSaveEditCaption} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-[11px] text-text-subtle font-medium block">
                  Foto Terpilih:
                </span>
                <img
                  src={getGalleryPublicUrl(editingGalleryItem.storage_path)}
                  alt="Foto Galeri"
                  className="w-full h-40 object-cover rounded-lg border border-border bg-surface-elevated"
                />
                <p className="text-[10px] text-text-subtle font-mono truncate">
                  {editingGalleryItem.storage_path}
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="editCaptionInput" className="font-semibold text-text-primary block">
                  Keterangan Foto (Caption)
                </label>
                <input
                  id="editCaptionInput"
                  type="text"
                  maxLength={200}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Contoh: Momen bahagia saat pertunangan"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
                <p className="text-[11px] text-text-subtle">
                  Maksimal 200 karakter. Keterangan ini akan tampil di bawah foto pada undangan.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditGalleryModalOpen(false);
                    setEditingGalleryItem(null);
                  }}
                  disabled={isSavingEditGallery}
                  className="py-1.5 px-3.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditGallery}
                  className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                >
                  {isSavingEditGallery ? 'Menyimpan...' : 'Simpan Keterangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Hapus Foto Galeri */}
      {deleteGalleryModalOpen && galleryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-danger">
              Hapus Foto Ini?
            </h2>

            {deleteGalleryErrorMessage && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {deleteGalleryErrorMessage}
              </div>
            )}

            <div className="flex items-center gap-3 p-2.5 bg-surface-elevated border border-border rounded-lg">
              <img
                src={getGalleryPublicUrl(galleryToDelete.storage_path)}
                alt="Foto yang akan dihapus"
                className="w-14 h-14 object-cover rounded border border-border shrink-0"
              />
              <div className="truncate text-xs">
                <p className="text-text-primary font-medium truncate">
                  {galleryToDelete.caption || 'Tanpa keterangan foto'}
                </p>
                <p className="text-[10px] text-text-subtle font-mono truncate">
                  {galleryToDelete.storage_path}
                </p>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Foto ini akan dihapus secara permanen dari penyimpanan cloud dan galeri dokumentasi undangan Anda. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteGalleryModalOpen(false);
                  setGalleryToDelete(null);
                  setDeleteGalleryErrorMessage(null);
                }}
                disabled={isDeletingGallery}
                className="py-1.5 px-3.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGallery}
                disabled={isDeletingGallery}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
              >
                {isDeletingGallery ? 'Menghapus...' : 'Ya, Hapus Foto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Konfirmasi Publikasi */}
      {publishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-primary">
              Publikasikan Undangan
            </h2>

            {publishValidationErrors.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-danger font-medium leading-relaxed">
                  Undangan belum memenuhi syarat minimum untuk dipublikasikan:
                </p>
                <ul className="list-disc list-inside text-xs text-danger space-y-1 p-3 bg-danger/10 border border-danger/30 rounded">
                  {publishValidationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="py-1.5 px-4 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
                  >
                    Tutup dan Perbaiki
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-muted leading-relaxed">
                  Undangan Anda akan dapat diakses secara publik melalui tautan:
                </p>
                <div className="p-2.5 bg-surface-elevated border border-border rounded font-mono text-xs text-text-primary">
                  /i/{draftSlug}
                </div>
                <p className="text-[11px] text-text-subtle leading-relaxed">
                  Tamu yang memiliki tautan dapat membuka undangan ini secara langsung. Anda dapat mengembalikan status ke draf kapan saja.
                </p>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    disabled={isPublishing}
                    className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPublishing ? 'Mempublikasikan...' : 'Ya, Publikasikan Sekarang'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Modal Sukses Publikasi */}
      {publishSuccessModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4 text-center">
            <h2 className="font-serif text-2xl font-bold text-primary">
              Undangan Telah Terbit
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Undangan pernikahan Anda telah aktif dan siap dibagikan kepada keluarga serta para tamu.
            </p>

            <div className="p-3 bg-surface-elevated border border-border rounded text-xs font-mono text-text-primary break-all">
              {window.location.origin}/i/{draftSlug}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto py-2 px-4 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
              >
                {linkCopied ? 'Tautan Disalin!' : 'Salin Tautan'}
              </button>
              <Link
                to={`/i/${draftSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors inline-block"
              >
                Buka Halaman Publik &rarr;
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPublishSuccessModalOpen(false)}
                className="text-xs text-text-muted hover:text-text-primary underline cursor-pointer"
              >
                Kembali ke Ruang Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal Konfirmasi Pembatalan Publikasi (Unpublish) */}
      {unpublishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-primary">
              Batalkan Publikasi Undangan?
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Halaman publik <strong className="font-mono text-text-primary">/i/{draftSlug}</strong> tidak akan dapat diakses oleh pengunjung umum hingga Anda mempublikasikannya kembali. Seluruh data undangan tetap tersimpan dengan aman.
            </p>

            {unpublishError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {unpublishError}
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnpublishModalOpen(false)}
                disabled={isUnpublishing}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnpublish}
                disabled={isUnpublishing}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUnpublishing ? 'Memproses...' : 'Ya, Kembalikan ke Draf'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Modal Konfirmasi Hapus Undangan */}
      {deleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-danger">
              Hapus Undangan Ini?
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Seluruh data undangan, termasuk konten mempelai, konfigurasi seksi, dan agenda acara yang terhubung akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Undangan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Modal Tambah / Edit Rekening & E-Wallet (Gift) */}
      {giftAccountModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-primary">
              {editingGiftAccountId ? 'Edit Rekening / E-Wallet' : 'Tambah Rekening / E-Wallet'}
            </h2>

            {giftAccountError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {giftAccountError}
              </div>
            )}

            <form onSubmit={handleSaveGiftAccount} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-text-primary block">
                  Jenis Akun
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGiftAccountForm({ ...giftAccountForm, type: 'bank' })}
                    className={`py-2 px-3 border rounded text-xs font-semibold cursor-pointer text-center transition-colors ${
                      giftAccountForm.type === 'bank'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface text-text-muted border-border hover:bg-surface-elevated'
                    }`}
                  >
                    Rekening Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiftAccountForm({ ...giftAccountForm, type: 'ewallet' })}
                    className={`py-2 px-3 border rounded text-xs font-semibold cursor-pointer text-center transition-colors ${
                      giftAccountForm.type === 'ewallet'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface text-text-muted border-border hover:bg-surface-elevated'
                    }`}
                  >
                    Dompet Digital (E-Wallet)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="giftAccProvider" className="font-semibold text-text-primary block">
                  {giftAccountForm.type === 'bank' ? 'Nama Bank' : 'Penyedia E-Wallet'}
                </label>
                <input
                  id="giftAccProvider"
                  type="text"
                  required
                  maxLength={50}
                  value={giftAccountForm.provider}
                  onChange={(e) => setGiftAccountForm({ ...giftAccountForm, provider: e.target.value })}
                  placeholder={giftAccountForm.type === 'bank' ? 'Contoh: BCA, Mandiri, BRI, BNI' : 'Contoh: GoPay, OVO, Dana, ShopeePay'}
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="giftAccNumber" className="font-semibold text-text-primary block">
                  {giftAccountForm.type === 'bank' ? 'Nomor Rekening' : 'Nomor Handphone / Akun'}
                </label>
                <input
                  id="giftAccNumber"
                  type="text"
                  required
                  maxLength={50}
                  value={giftAccountForm.account_number}
                  onChange={(e) => setGiftAccountForm({ ...giftAccountForm, account_number: e.target.value })}
                  placeholder="Contoh: 1234567890"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="giftAccHolder" className="font-semibold text-text-primary block">
                  Nama Pemilik Akun
                </label>
                <input
                  id="giftAccHolder"
                  type="text"
                  required
                  maxLength={100}
                  value={giftAccountForm.holder_name}
                  onChange={(e) => setGiftAccountForm({ ...giftAccountForm, holder_name: e.target.value })}
                  placeholder="Contoh: Muhammad Raditya"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="giftAccLabel" className="font-semibold text-text-primary block">
                  Label Rekening (Opsional)
                </label>
                <input
                  id="giftAccLabel"
                  type="text"
                  maxLength={50}
                  value={giftAccountForm.label}
                  onChange={(e) => setGiftAccountForm({ ...giftAccountForm, label: e.target.value })}
                  placeholder="Contoh: Rekening Mempelai Pria"
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="giftAccEnabled"
                  type="checkbox"
                  checked={giftAccountForm.is_enabled}
                  onChange={(e) => setGiftAccountForm({ ...giftAccountForm, is_enabled: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="giftAccEnabled" className="text-xs text-text-primary cursor-pointer select-none">
                  Aktifkan rekening ini pada undangan publik
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGiftAccountModalOpen(false);
                    setGiftAccountError(null);
                  }}
                  className="py-1.5 px-3.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer min-h-[36px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer min-h-[36px]"
                >
                  {editingGiftAccountId ? 'Perbarui Rekening' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Modal Konfirmasi Hapus Rekening (Gift) */}
      {deleteGiftAccountModalOpen && accountToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-danger">
              Hapus Rekening Hadiah?
            </h2>

            <div className="p-3 bg-surface-elevated border border-border rounded text-xs space-y-1">
              <p className="font-semibold text-text-primary">
                {accountToDelete.provider} - {accountToDelete.account_number}
              </p>
              <p className="text-text-muted">
                a.n. {accountToDelete.holder_name}
              </p>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Data rekening ini akan dihapus dari daftar amplop digital Anda. Klik Simpan Perubahan di toolbar setelah ini untuk menyimpan konfigurasi secara permanen.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteGiftAccountModalOpen(false);
                  setAccountToDelete(null);
                }}
                className="py-1.5 px-3.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer min-h-[36px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGiftAccount}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer min-h-[36px]"
              >
                Ya, Hapus Rekening
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

