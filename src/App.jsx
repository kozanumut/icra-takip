import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, FileText, Users, Bell, Filter, ChevronRight, X, Check, Clock, AlertCircle, Send, Trash2, Edit3, Calendar, Tag, ArrowLeft, MoreVertical, Briefcase, UserCheck, CircleDot, Archive } from 'lucide-react';

const STORAGE_KEYS = {
  FILES: 'icra:files',
  STAFF: 'icra:staff',
  TASKS: 'icra:tasks',
  SEED: 'icra:seeded_v1'
};

const DURUM_RENK = {
  'Açık': { bg: '#1e3a5f', text: '#a8c5e8', dot: '#4a90e2' },
  'Derdest': { bg: '#3d2914', text: '#e8c5a8', dot: '#d4914a' },
  'Haciz': { bg: '#3d1f1f', text: '#e8a8a8', dot: '#d44a4a' },
  'Satış': { bg: '#1f3d1f', text: '#a8e8a8', dot: '#4ad44a' },
  'Tahsil': { bg: '#1f2f3d', text: '#a8c8e8', dot: '#4a7ad4' },
  'Kapanan': { bg: '#2a2a2a', text: '#888', dot: '#666' }
};

const ONCELIK_RENK = {
  'Acil': '#e74c3c',
  'Yüksek': '#e67e22',
  'Normal': '#3498db',
  'Düşük': '#95a5a6'
};

const SEED_STAFF = [
  { id: 's1', name: 'Av. Mehmet Yılmaz', role: 'Stajyer Avukat', initials: 'MY' },
  { id: 's2', name: 'Ayşe Demir', role: 'Sekreter', initials: 'AD' },
  { id: 's3', name: 'Kemal Öztürk', role: 'İcra Takipçisi', initials: 'KÖ' }
];

const SEED_FILES = [
  {
    id: 'f1',
    dosyaNo: '2024/12847',
    icraDairesi: 'Ankara 12. İcra Dairesi',
    alacakli: 'ABC Faktoring A.Ş.',
    borclu: 'Ahmet Kaya',
    tutar: 245000,
    durum: 'Haciz',
    sonIslem: '2026-05-15',
    notlar: 'Mahcuz taşınmaz için kıymet takdiri bekleniyor'
  },
  {
    id: 'f2',
    dosyaNo: '2025/3421',
    icraDairesi: 'Ankara 5. İcra Dairesi',
    alacakli: 'XYZ Lojistik Ltd.',
    borclu: 'Mustafa Çelik',
    tutar: 87500,
    durum: 'Derdest',
    sonIslem: '2026-05-10',
    notlar: 'İtiraz dilekçesi geldi, cevap hazırlanacak'
  },
  {
    id: 'f3',
    dosyaNo: '2025/8902',
    icraDairesi: 'Ankara 18. İcra Dairesi',
    alacakli: 'Mehmet Yıldız',
    borclu: 'Ticaret A.Ş.',
    tutar: 540000,
    durum: 'Satış',
    sonIslem: '2026-05-17',
    notlar: 'Birinci satış ilanı yapıldı'
  },
  {
    id: 'f4',
    dosyaNo: '2024/9988',
    icraDairesi: 'İstanbul Anadolu 7. İcra',
    alacakli: 'KozanUmut',
    borclu: 'Elif Şahin',
    tutar: 32000,
    durum: 'Tahsil',
    sonIslem: '2026-05-12',
    notlar: 'Taksitli ödeme planı uygulanıyor'
  }
];

function fmtPara(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function fmtTarih(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTarihSaat(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function IcraTakipApp() {
  const [view, setView] = useState('files'); // files | tasks | staff
  const [files, setFiles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileForm, setShowFileForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [taskFilePreset, setTaskFilePreset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [durumFilter, setDurumFilter] = useState('Tümü');
  const [taskFilter, setTaskFilter] = useState('Bekleyen');
  const [toast, setToast] = useState(null);

  // ---- Veri Yükleme (localStorage) ----
  useEffect(() => {
    try {
      const seeded = localStorage.getItem(STORAGE_KEYS.SEED);
      if (!seeded) {
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(SEED_FILES));
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(SEED_STAFF));
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SEED, 'true');
        setFiles(SEED_FILES);
        setStaff(SEED_STAFF);
        setTasks([]);
      } else {
        const f = localStorage.getItem(STORAGE_KEYS.FILES);
        const s = localStorage.getItem(STORAGE_KEYS.STAFF);
        const t = localStorage.getItem(STORAGE_KEYS.TASKS);
        setFiles(f ? JSON.parse(f) : []);
        setStaff(s ? JSON.parse(s) : []);
        setTasks(t ? JSON.parse(t) : []);
      }
    } catch (e) {
      console.error('Yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const persistFiles = (next) => {
    setFiles(next);
    try { localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(next)); } catch (e) { console.error(e); }
  };
  const persistStaff = (next) => {
    setStaff(next);
    try { localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(next)); } catch (e) { console.error(e); }
  };
  const persistTasks = (next) => {
    setTasks(next);
    try { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(next)); } catch (e) { console.error(e); }
  };

  // ---- Dosya CRUD ----
  const saveFile = async (data) => {
    if (data.id) {
      persistFiles(files.map(f => f.id === data.id ? data : f));
      showToast('Dosya güncellendi');
    } else {
      const yeni = { ...data, id: 'f' + Date.now() };
      persistFiles([yeni, ...files]);
      showToast('Dosya eklendi');
    }
    setShowFileForm(false);
  };

  const deleteFile = async (id) => {
    persistFiles(files.filter(f => f.id !== id));
    persistTasks(tasks.filter(t => t.dosyaId !== id));
    setSelectedFile(null);
    showToast('Dosya silindi');
  };

  // ---- Görev CRUD ----
  const saveTask = async (data) => {
    if (data.id) {
      persistTasks(tasks.map(t => t.id === data.id ? data : t));
      showToast('Talimat güncellendi');
    } else {
      const yeni = {
        ...data,
        id: 't' + Date.now(),
        olusturma: new Date().toISOString(),
        durum: 'bekliyor'
      };
      persistTasks([yeni, ...tasks]);
      showToast('Talimat gönderildi');
    }
    setShowTaskForm(false);
    setTaskFilePreset(null);
  };

  const toggleTaskDone = async (id) => {
    persistTasks(tasks.map(t => t.id === id ? {
      ...t,
      durum: t.durum === 'tamamlandı' ? 'bekliyor' : 'tamamlandı',
      tamamlanma: t.durum === 'tamamlandı' ? null : new Date().toISOString()
    } : t));
  };

  const deleteTask = async (id) => {
    persistTasks(tasks.filter(t => t.id !== id));
    showToast('Talimat silindi');
  };

  // ---- Personel CRUD ----
  const saveStaff = async (data) => {
    if (data.id) {
      persistStaff(staff.map(s => s.id === data.id ? data : s));
      showToast('Personel güncellendi');
    } else {
      const initials = data.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      persistStaff([...staff, { ...data, id: 's' + Date.now(), initials }]);
      showToast('Personel eklendi');
    }
    setShowStaffForm(false);
  };

  const deleteStaff = async (id) => {
    persistStaff(staff.filter(s => s.id !== id));
    showToast('Personel silindi');
  };

  // ---- Filtreleme ----
  const filteredFiles = useMemo(() => {
    let arr = files;
    if (durumFilter !== 'Tümü') arr = arr.filter(f => f.durum === durumFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(f =>
        f.dosyaNo.toLowerCase().includes(q) ||
        f.alacakli.toLowerCase().includes(q) ||
        f.borclu.toLowerCase().includes(q) ||
        f.icraDairesi.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [files, durumFilter, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'Bekleyen') return tasks.filter(t => t.durum === 'bekliyor');
    if (taskFilter === 'Tamamlanan') return tasks.filter(t => t.durum === 'tamamlandı');
    return tasks;
  }, [tasks, taskFilter]);

  const bekleyenSayisi = tasks.filter(t => t.durum === 'bekliyor').length;

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <div style={{ marginTop: 20, color: '#8a9bb4', fontFamily: 'Georgia, serif', letterSpacing: 1 }}>Yükleniyor</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{globalCss}</style>

      {/* ÜST BAR */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.brand}>İCRA · TAKİP</div>
            <div style={styles.brandSub}>Hukuk Bürosu Yönetim Paneli</div>
          </div>
          <div style={styles.bellWrap}>
            <Bell size={20} color="#c8d4e8" />
            {bekleyenSayisi > 0 && <span style={styles.bellBadge}>{bekleyenSayisi}</span>}
          </div>
        </div>
      </header>

      {/* ANA İÇERİK */}
      <main style={styles.main}>
        {view === 'files' && (
          <FilesView
            files={filteredFiles}
            totalFiles={files.length}
            tasks={tasks}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            durumFilter={durumFilter}
            setDurumFilter={setDurumFilter}
            onSelectFile={setSelectedFile}
            onAddFile={() => setShowFileForm(true)}
          />
        )}
        {view === 'tasks' && (
          <TasksView
            tasks={filteredTasks}
            allTasks={tasks}
            files={files}
            staff={staff}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            onToggleDone={toggleTaskDone}
            onDelete={deleteTask}
            onAddTask={() => setShowTaskForm(true)}
          />
        )}
        {view === 'staff' && (
          <StaffView
            staff={staff}
            tasks={tasks}
            onAdd={() => setShowStaffForm(true)}
            onDelete={deleteStaff}
          />
        )}
      </main>

      {/* ALT NAVIGASYON */}
      <nav style={styles.bottomNav}>
        <NavButton icon={<Briefcase size={20} />} label="Dosyalar" active={view === 'files'} onClick={() => setView('files')} />
        <NavButton icon={<FileText size={20} />} label="Talimatlar" active={view === 'tasks'} onClick={() => setView('tasks')} badge={bekleyenSayisi} />
        <NavButton icon={<Users size={20} />} label="Ekip" active={view === 'staff'} onClick={() => setView('staff')} />
      </nav>

      {/* MODALLAR */}
      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          tasks={tasks.filter(t => t.dosyaId === selectedFile.id)}
          staff={staff}
          onClose={() => setSelectedFile(null)}
          onEdit={() => { setShowFileForm(selectedFile); setSelectedFile(null); }}
          onDelete={() => deleteFile(selectedFile.id)}
          onAddTask={() => {
            setTaskFilePreset(selectedFile.id);
            setShowTaskForm(true);
            setSelectedFile(null);
          }}
          onToggleTask={toggleTaskDone}
        />
      )}

      {showFileForm && (
        <FileForm
          initial={typeof showFileForm === 'object' ? showFileForm : null}
          onSave={saveFile}
          onCancel={() => setShowFileForm(false)}
        />
      )}

      {showTaskForm && (
        <TaskForm
          files={files}
          staff={staff}
          filePreset={taskFilePreset}
          onSave={saveTask}
          onCancel={() => { setShowTaskForm(false); setTaskFilePreset(null); }}
        />
      )}

      {showStaffForm && (
        <StaffForm
          onSave={saveStaff}
          onCancel={() => setShowStaffForm(false)}
        />
      )}

      {toast && (
        <div style={styles.toast}>
          <Check size={16} /> {toast}
        </div>
      )}
    </div>
  );
}

// ============ DOSYALAR GÖRÜNÜMÜ ============
function FilesView({ files, totalFiles, tasks, searchQuery, setSearchQuery, durumFilter, setDurumFilter, onSelectFile, onAddFile }) {
  const durumlar = ['Tümü', 'Açık', 'Derdest', 'Haciz', 'Satış', 'Tahsil', 'Kapanan'];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.viewTitle}>
        <div>
          <div style={styles.viewTitleText}>İcra Dosyaları</div>
          <div style={styles.viewSubtitle}>{files.length} dosya · {totalFiles} toplam</div>
        </div>
        <button style={styles.iconButton} onClick={onAddFile} aria-label="Yeni dosya">
          <Plus size={20} />
        </button>
      </div>

      <div style={styles.searchWrap}>
        <Search size={16} color="#5a6b87" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          style={styles.searchInput}
          placeholder="Dosya no, taraf, daire ara..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={styles.chipScroll}>
        {durumlar.map(d => (
          <button
            key={d}
            onClick={() => setDurumFilter(d)}
            style={{
              ...styles.chip,
              ...(durumFilter === d ? styles.chipActive : {})
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <div style={styles.fileList}>
        {files.length === 0 ? (
          <EmptyState icon={<Briefcase size={36} />} text="Dosya bulunamadı" sub="Yeni dosya eklemek için + butonuna dokunun" />
        ) : files.map(f => {
          const dosyaTaskSayisi = tasks.filter(t => t.dosyaId === f.id && t.durum === 'bekliyor').length;
          const renk = DURUM_RENK[f.durum] || DURUM_RENK['Açık'];
          return (
            <div key={f.id} style={styles.fileCard} onClick={() => onSelectFile(f)}>
              <div style={styles.fileCardTop}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.fileNo}>{f.dosyaNo}</div>
                  <div style={styles.fileDaire}>{f.icraDairesi}</div>
                </div>
                <div style={{ ...styles.durumBadge, background: renk.bg, color: renk.text }}>
                  <span style={{ ...styles.durumDot, background: renk.dot }}></span>
                  {f.durum}
                </div>
              </div>
              <div style={styles.fileMid}>
                <div style={styles.taraflar}>
                  <div style={styles.tarafRow}>
                    <span style={styles.tarafLabel}>Alacaklı</span>
                    <span style={styles.tarafName}>{f.alacakli}</span>
                  </div>
                  <div style={styles.tarafRow}>
                    <span style={styles.tarafLabel}>Borçlu</span>
                    <span style={styles.tarafName}>{f.borclu}</span>
                  </div>
                </div>
              </div>
              <div style={styles.fileBottom}>
                <div style={styles.tutar}>{fmtPara(f.tutar)}</div>
                <div style={styles.fileBottomRight}>
                  {dosyaTaskSayisi > 0 && (
                    <div style={styles.taskCount}>
                      <CircleDot size={12} /> {dosyaTaskSayisi} talimat
                    </div>
                  )}
                  <ChevronRight size={18} color="#5a6b87" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ TALİMATLAR GÖRÜNÜMÜ ============
function TasksView({ tasks, allTasks, files, staff, taskFilter, setTaskFilter, onToggleDone, onDelete, onAddTask }) {
  const filters = ['Bekleyen', 'Tamamlanan', 'Tümü'];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.viewTitle}>
        <div>
          <div style={styles.viewTitleText}>Talimatlar</div>
          <div style={styles.viewSubtitle}>
            {allTasks.filter(t => t.durum === 'bekliyor').length} bekliyor · {allTasks.length} toplam
          </div>
        </div>
        <button style={styles.iconButton} onClick={onAddTask} aria-label="Yeni talimat">
          <Plus size={20} />
        </button>
      </div>

      <div style={styles.chipScroll}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setTaskFilter(f)}
            style={{
              ...styles.chip,
              ...(taskFilter === f ? styles.chipActive : {})
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={styles.fileList}>
        {tasks.length === 0 ? (
          <EmptyState icon={<FileText size={36} />} text="Talimat bulunamadı" sub="Bir dosya açıp talimat verebilirsiniz" />
        ) : tasks.map(t => {
          const dosya = files.find(f => f.id === t.dosyaId);
          const personel = staff.find(s => s.id === t.personelId);
          const oncelikRenk = ONCELIK_RENK[t.oncelik] || ONCELIK_RENK['Normal'];
          return (
            <div key={t.id} style={{
              ...styles.taskCard,
              opacity: t.durum === 'tamamlandı' ? 0.55 : 1
            }}>
              <div style={styles.taskTop}>
                <button
                  style={{
                    ...styles.checkbox,
                    background: t.durum === 'tamamlandı' ? '#4a8a4a' : 'transparent',
                    borderColor: t.durum === 'tamamlandı' ? '#4a8a4a' : '#3d4f6b'
                  }}
                  onClick={() => onToggleDone(t.id)}
                >
                  {t.durum === 'tamamlandı' && <Check size={14} color="#fff" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    ...styles.taskTitle,
                    textDecoration: t.durum === 'tamamlandı' ? 'line-through' : 'none'
                  }}>{t.baslik}</div>
                  {t.aciklama && <div style={styles.taskDesc}>{t.aciklama}</div>}
                </div>
                <button style={styles.taskDelete} onClick={() => onDelete(t.id)} aria-label="Sil">
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={styles.taskMeta}>
                {dosya && (
                  <div style={styles.metaTag}>
                    <Briefcase size={11} /> {dosya.dosyaNo}
                  </div>
                )}
                {personel && (
                  <div style={styles.metaTag}>
                    <UserCheck size={11} /> {personel.name.split(' ')[0]}
                  </div>
                )}
                <div style={{ ...styles.metaTag, color: oncelikRenk, borderColor: oncelikRenk + '55' }}>
                  <AlertCircle size={11} /> {t.oncelik}
                </div>
                {t.sonTarih && (
                  <div style={styles.metaTag}>
                    <Calendar size={11} /> {fmtTarih(t.sonTarih)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ EKİP GÖRÜNÜMÜ ============
function StaffView({ staff, tasks, onAdd, onDelete }) {
  return (
    <div style={styles.viewContainer}>
      <div style={styles.viewTitle}>
        <div>
          <div style={styles.viewTitleText}>Ekip</div>
          <div style={styles.viewSubtitle}>{staff.length} kişi</div>
        </div>
        <button style={styles.iconButton} onClick={onAdd} aria-label="Yeni personel">
          <Plus size={20} />
        </button>
      </div>

      <div style={styles.fileList}>
        {staff.length === 0 ? (
          <EmptyState icon={<Users size={36} />} text="Ekip üyesi yok" sub="Talimat verebilmek için personel ekleyin" />
        ) : staff.map(s => {
          const activeTasks = tasks.filter(t => t.personelId === s.id && t.durum === 'bekliyor').length;
          const doneTasks = tasks.filter(t => t.personelId === s.id && t.durum === 'tamamlandı').length;
          return (
            <div key={s.id} style={styles.staffCard}>
              <div style={styles.avatar}>{s.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.staffName}>{s.name}</div>
                <div style={styles.staffRole}>{s.role}</div>
                <div style={styles.staffStats}>
                  <span style={{ color: '#e8c5a8' }}>{activeTasks} aktif</span>
                  <span style={{ color: '#5a6b87' }}>·</span>
                  <span style={{ color: '#5a6b87' }}>{doneTasks} tamamlanan</span>
                </div>
              </div>
              <button style={styles.taskDelete} onClick={() => onDelete(s.id)} aria-label="Sil">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ DOSYA DETAY MODAL ============
function FileDetailModal({ file, tasks, staff, onClose, onEdit, onDelete, onAddTask, onToggleTask }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const renk = DURUM_RENK[file.durum] || DURUM_RENK['Açık'];

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <button style={styles.modalBack} onClick={onClose}>
            <ArrowLeft size={20} />
          </button>
          <div style={styles.modalTitle}>Dosya Detayı</div>
          <button style={styles.modalAction} onClick={onEdit}>
            <Edit3 size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.detailHero}>
            <div style={styles.detailDosyaNo}>{file.dosyaNo}</div>
            <div style={styles.detailDaire}>{file.icraDairesi}</div>
            <div style={{ ...styles.durumBadge, background: renk.bg, color: renk.text, alignSelf: 'flex-start', marginTop: 12 }}>
              <span style={{ ...styles.durumDot, background: renk.dot }}></span>
              {file.durum}
            </div>
          </div>

          <div style={styles.detailSection}>
            <div style={styles.detailLabel}>Taraflar</div>
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Alacaklı</span>
              <span style={styles.detailVal}>{file.alacakli}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Borçlu</span>
              <span style={styles.detailVal}>{file.borclu}</span>
            </div>
          </div>

          <div style={styles.detailSection}>
            <div style={styles.detailLabel}>Mali Bilgiler</div>
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Takip Tutarı</span>
              <span style={{ ...styles.detailVal, fontWeight: 600, color: '#e8c5a8' }}>{fmtPara(file.tutar)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Son İşlem</span>
              <span style={styles.detailVal}>{fmtTarih(file.sonIslem)}</span>
            </div>
          </div>

          {file.notlar && (
            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Notlar</div>
              <div style={styles.notlar}>{file.notlar}</div>
            </div>
          )}

          <div style={styles.detailSection}>
            <div style={styles.detailLabelRow}>
              <div style={styles.detailLabel}>Talimatlar ({tasks.length})</div>
              <button style={styles.linkBtn} onClick={onAddTask}>
                <Plus size={14} /> Talimat Ver
              </button>
            </div>
            {tasks.length === 0 ? (
              <div style={styles.emptyMini}>Bu dosyaya henüz talimat verilmemiş</div>
            ) : tasks.map(t => {
              const personel = staff.find(s => s.id === t.personelId);
              return (
                <div key={t.id} style={styles.miniTask}>
                  <button
                    style={{
                      ...styles.checkbox,
                      background: t.durum === 'tamamlandı' ? '#4a8a4a' : 'transparent',
                      borderColor: t.durum === 'tamamlandı' ? '#4a8a4a' : '#3d4f6b'
                    }}
                    onClick={() => onToggleTask(t.id)}
                  >
                    {t.durum === 'tamamlandı' && <Check size={14} color="#fff" />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      ...styles.miniTaskTitle,
                      textDecoration: t.durum === 'tamamlandı' ? 'line-through' : 'none',
                      opacity: t.durum === 'tamamlandı' ? 0.6 : 1
                    }}>{t.baslik}</div>
                    {personel && <div style={styles.miniTaskMeta}>{personel.name} · {t.oncelik}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.detailSection}>
            {!showConfirm ? (
              <button style={styles.dangerBtn} onClick={() => setShowConfirm(true)}>
                <Trash2 size={16} /> Dosyayı Sil
              </button>
            ) : (
              <div style={styles.confirmBox}>
                <div style={{ color: '#e8a8a8', marginBottom: 12, fontSize: 14 }}>Bu dosyayı silmek istediğinize emin misiniz? İlgili tüm talimatlar da silinecek.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={styles.confirmBtnNo} onClick={() => setShowConfirm(false)}>Vazgeç</button>
                  <button style={styles.confirmBtnYes} onClick={onDelete}>Evet, Sil</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ DOSYA FORMU ============
function FileForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    dosyaNo: '', icraDairesi: '', alacakli: '', borclu: '', tutar: '', durum: 'Açık', sonIslem: new Date().toISOString().split('T')[0], notlar: ''
  });

  const handleSave = () => {
    if (!form.dosyaNo || !form.alacakli || !form.borclu) {
      alert('Dosya no, alacaklı ve borçlu zorunludur');
      return;
    }
    onSave({ ...form, tutar: Number(form.tutar) || 0 });
  };

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <button style={styles.modalBack} onClick={onCancel}>
            <X size={20} />
          </button>
          <div style={styles.modalTitle}>{initial ? 'Dosyayı Düzenle' : 'Yeni Dosya'}</div>
          <button style={styles.modalSave} onClick={handleSave}>Kaydet</button>
        </div>
        <div style={styles.modalBody}>
          <FormField label="Dosya No *" value={form.dosyaNo} onChange={v => setForm({ ...form, dosyaNo: v })} placeholder="2026/12345" />
          <FormField label="İcra Dairesi" value={form.icraDairesi} onChange={v => setForm({ ...form, icraDairesi: v })} placeholder="Ankara X. İcra Dairesi" />
          <FormField label="Alacaklı *" value={form.alacakli} onChange={v => setForm({ ...form, alacakli: v })} />
          <FormField label="Borçlu *" value={form.borclu} onChange={v => setForm({ ...form, borclu: v })} />
          <FormField label="Takip Tutarı (TL)" type="number" value={form.tutar} onChange={v => setForm({ ...form, tutar: v })} />
          <FormSelect label="Durum" value={form.durum} onChange={v => setForm({ ...form, durum: v })} options={['Açık', 'Derdest', 'Haciz', 'Satış', 'Tahsil', 'Kapanan']} />
          <FormField label="Son İşlem Tarihi" type="date" value={form.sonIslem} onChange={v => setForm({ ...form, sonIslem: v })} />
          <FormField label="Notlar" value={form.notlar} onChange={v => setForm({ ...form, notlar: v })} multiline />
        </div>
      </div>
    </div>
  );
}

// ============ TALİMAT FORMU ============
function TaskForm({ files, staff, filePreset, onSave, onCancel }) {
  const [form, setForm] = useState({
    baslik: '',
    aciklama: '',
    dosyaId: filePreset || (files[0]?.id || ''),
    personelId: staff[0]?.id || '',
    oncelik: 'Normal',
    sonTarih: ''
  });

  const handleSave = () => {
    if (!form.baslik) { alert('Talimat başlığı zorunludur'); return; }
    if (!form.personelId) { alert('Önce personel ekleyin'); return; }
    onSave(form);
  };

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <button style={styles.modalBack} onClick={onCancel}>
            <X size={20} />
          </button>
          <div style={styles.modalTitle}>Yeni Talimat</div>
          <button style={styles.modalSave} onClick={handleSave}>
            <Send size={14} /> Gönder
          </button>
        </div>
        <div style={styles.modalBody}>
          <FormField label="Talimat Başlığı *" value={form.baslik} onChange={v => setForm({ ...form, baslik: v })} placeholder="örn. Haciz tutanağını UYAP'tan indir" />
          <FormField label="Açıklama" value={form.aciklama} onChange={v => setForm({ ...form, aciklama: v })} multiline placeholder="Detaylar..." />
          <FormSelect
            label="İlgili Dosya"
            value={form.dosyaId}
            onChange={v => setForm({ ...form, dosyaId: v })}
            options={files.map(f => ({ value: f.id, label: `${f.dosyaNo} — ${f.borclu}` }))}
          />
          <FormSelect
            label="Atanan Personel *"
            value={form.personelId}
            onChange={v => setForm({ ...form, personelId: v })}
            options={staff.map(s => ({ value: s.id, label: `${s.name} (${s.role})` }))}
          />
          <FormSelect label="Öncelik" value={form.oncelik} onChange={v => setForm({ ...form, oncelik: v })} options={['Acil', 'Yüksek', 'Normal', 'Düşük']} />
          <FormField label="Son Tarih" type="date" value={form.sonTarih} onChange={v => setForm({ ...form, sonTarih: v })} />
        </div>
      </div>
    </div>
  );
}

// ============ PERSONEL FORMU ============
function StaffForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', role: 'Stajyer Avukat' });

  const handleSave = () => {
    if (!form.name) { alert('İsim zorunludur'); return; }
    onSave(form);
  };

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <button style={styles.modalBack} onClick={onCancel}>
            <X size={20} />
          </button>
          <div style={styles.modalTitle}>Yeni Personel</div>
          <button style={styles.modalSave} onClick={handleSave}>Kaydet</button>
        </div>
        <div style={styles.modalBody}>
          <FormField label="Ad Soyad *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <FormSelect label="Görev" value={form.role} onChange={v => setForm({ ...form, role: v })} options={['Stajyer Avukat', 'Avukat', 'Sekreter', 'İcra Takipçisi', 'Mübaşir', 'Diğer']} />
        </div>
      </div>
    </div>
  );
}

// ============ YARDIMCI BİLEŞENLER ============
function FormField({ label, value, onChange, type = 'text', placeholder, multiline }) {
  return (
    <div style={styles.formField}>
      <label style={styles.formLabel}>{label}</label>
      {multiline ? (
        <textarea
          style={{ ...styles.formInput, minHeight: 80, resize: 'vertical' }}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          style={styles.formInput}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div style={styles.formField}>
      <label style={styles.formLabel}>{label}</label>
      <select style={styles.formInput} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}

function NavButton({ icon, label, active, onClick, badge }) {
  return (
    <button style={{ ...styles.navBtn, color: active ? '#e8c5a8' : '#5a6b87' }} onClick={onClick}>
      <div style={{ position: 'relative' }}>
        {icon}
        {badge > 0 && <span style={styles.navBadge}>{badge > 9 ? '9+' : badge}</span>}
      </div>
      <span style={styles.navLabel}>{label}</span>
      {active && <div style={styles.navIndicator}></div>}
    </button>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={styles.emptyState}>
      <div style={{ color: '#3d4f6b', marginBottom: 16 }}>{icon}</div>
      <div style={{ color: '#8a9bb4', fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 6 }}>{text}</div>
      <div style={{ color: '#5a6b87', fontSize: 13 }}>{sub}</div>
    </div>
  );
}

// ============ STİLLER ============
const globalCss = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; }
  input, textarea, select, button { font-family: inherit; }
  input:focus, textarea:focus, select:focus { outline: none; border-color: #e8c5a8 !important; }
  button { cursor: pointer; }
  button:active { transform: scale(0.97); }
  .fc-card { transition: all 0.2s ease; }
  .fc-card:active { transform: scale(0.98); }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a3a52; border-radius: 3px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const styles = {
  app: {
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a1424 0%, #0d1a2e 100%)',
    color: '#e8eef7',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    paddingBottom: 80,
    position: 'relative'
  },
  loadingScreen: {
    minHeight: '100vh',
    background: '#0a1424',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    width: 32,
    height: 32,
    border: '2px solid #2a3a52',
    borderTopColor: '#e8c5a8',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  header: {
    background: 'linear-gradient(180deg, rgba(13,26,46,0.95) 0%, rgba(13,26,46,0.85) 100%)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1a2a44',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    padding: '16px 20px'
  },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#e8c5a8'
  },
  brandSub: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#5a6b87',
    textTransform: 'uppercase',
    marginTop: 2
  },
  bellWrap: {
    position: 'relative',
    width: 40,
    height: 40,
    background: '#1a2a44',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #2a3a52'
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    background: '#d44a4a',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px'
  },
  main: { padding: '20px 16px' },
  viewContainer: { animation: 'fadeIn 0.3s ease' },
  viewTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  viewTitleText: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: 26,
    fontWeight: 700,
    color: '#e8eef7'
  },
  viewSubtitle: { fontSize: 12, color: '#5a6b87', marginTop: 2, letterSpacing: 0.5 },
  iconButton: {
    width: 44,
    height: 44,
    background: 'linear-gradient(135deg, #e8c5a8 0%, #d4a87a 100%)',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(232, 197, 168, 0.25)'
  },
  searchWrap: { position: 'relative', marginBottom: 14 },
  searchInput: {
    width: '100%',
    padding: '12px 14px 12px 40px',
    background: '#1a2a44',
    border: '1px solid #2a3a52',
    borderRadius: 12,
    color: '#e8eef7',
    fontSize: 14
  },
  chipScroll: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    marginBottom: 16,
    paddingBottom: 4,
    scrollbarWidth: 'none'
  },
  chip: {
    background: '#1a2a44',
    border: '1px solid #2a3a52',
    color: '#8a9bb4',
    padding: '8px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    letterSpacing: 0.3
  },
  chipActive: {
    background: '#e8c5a8',
    color: '#1a1a1a',
    border: '1px solid #e8c5a8',
    fontWeight: 600
  },
  fileList: { display: 'flex', flexDirection: 'column', gap: 12 },
  fileCard: {
    background: 'linear-gradient(135deg, #142540 0%, #0f1d33 100%)',
    border: '1px solid #1f2f4a',
    borderRadius: 14,
    padding: 16,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    animation: 'slideUp 0.3s ease'
  },
  fileCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  fileNo: {
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    fontSize: 15,
    fontWeight: 600,
    color: '#e8c5a8',
    letterSpacing: 0.5
  },
  fileDaire: { fontSize: 12, color: '#8a9bb4', marginTop: 4 },
  durumBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    letterSpacing: 0.3
  },
  durumDot: { width: 6, height: 6, borderRadius: '50%' },
  fileMid: { marginBottom: 12 },
  taraflar: { display: 'flex', flexDirection: 'column', gap: 6 },
  tarafRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  tarafLabel: {
    fontSize: 10,
    color: '#5a6b87',
    textTransform: 'uppercase',
    letterSpacing: 1,
    minWidth: 56
  },
  tarafName: { color: '#c8d4e8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTop: '1px solid #1f2f4a'
  },
  tutar: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: 17,
    fontWeight: 700,
    color: '#e8c5a8'
  },
  fileBottomRight: { display: 'flex', alignItems: 'center', gap: 10 },
  taskCount: {
    fontSize: 11,
    color: '#d4914a',
    background: 'rgba(212, 145, 74, 0.12)',
    padding: '4px 8px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500
  },
  taskCard: {
    background: 'linear-gradient(135deg, #142540 0%, #0f1d33 100%)',
    border: '1px solid #1f2f4a',
    borderRadius: 14,
    padding: 14,
    animation: 'slideUp 0.3s ease'
  },
  taskTop: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: 'transparent',
    marginTop: 2
  },
  taskTitle: { fontSize: 14, fontWeight: 500, color: '#e8eef7', lineHeight: 1.4 },
  taskDesc: { fontSize: 12, color: '#8a9bb4', marginTop: 4, lineHeight: 1.4 },
  taskDelete: {
    width: 28,
    height: 28,
    background: 'transparent',
    border: 'none',
    color: '#5a6b87',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6
  },
  taskMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 34
  },
  metaTag: {
    fontSize: 10,
    color: '#8a9bb4',
    background: 'rgba(42, 58, 82, 0.4)',
    border: '1px solid #2a3a52',
    padding: '3px 8px',
    borderRadius: 12,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500,
    letterSpacing: 0.3
  },
  staffCard: {
    background: 'linear-gradient(135deg, #142540 0%, #0f1d33 100%)',
    border: '1px solid #1f2f4a',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    animation: 'slideUp 0.3s ease'
  },
  avatar: {
    width: 48,
    height: 48,
    background: 'linear-gradient(135deg, #e8c5a8 0%, #d4914a 100%)',
    color: '#1a1a1a',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    fontFamily: '"Playfair Display", Georgia, serif',
    letterSpacing: 0.5,
    flexShrink: 0
  },
  staffName: { fontSize: 15, fontWeight: 600, color: '#e8eef7' },
  staffRole: { fontSize: 12, color: '#8a9bb4', marginTop: 2 },
  staffStats: { fontSize: 11, marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 480,
    margin: '0 auto',
    background: 'rgba(10, 20, 36, 0.95)',
    backdropFilter: 'blur(16px)',
    borderTop: '1px solid #1a2a44',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 0 12px',
    zIndex: 40
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '4px 12px',
    position: 'relative'
  },
  navLabel: { fontSize: 10, fontWeight: 600, letterSpacing: 0.5 },
  navIndicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    background: '#e8c5a8',
    borderRadius: 2
  },
  navBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    background: '#d44a4a',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 12, 24, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    animation: 'fadeIn 0.2s ease'
  },
  modal: {
    background: 'linear-gradient(180deg, #0f1d33 0%, #0a1424 100%)',
    width: '100%',
    maxWidth: 480,
    maxHeight: '92vh',
    borderRadius: '20px 20px 0 0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease',
    border: '1px solid #1f2f4a',
    borderBottom: 'none'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #1a2a44',
    background: 'rgba(15, 29, 51, 0.6)'
  },
  modalBack: {
    width: 36,
    height: 36,
    background: '#1a2a44',
    border: 'none',
    borderRadius: 10,
    color: '#c8d4e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: 16,
    fontWeight: 600,
    color: '#e8c5a8',
    letterSpacing: 0.5
  },
  modalAction: {
    width: 36,
    height: 36,
    background: '#1a2a44',
    border: 'none',
    borderRadius: 10,
    color: '#e8c5a8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSave: {
    background: 'linear-gradient(135deg, #e8c5a8 0%, #d4a87a 100%)',
    color: '#1a1a1a',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  modalBody: { overflowY: 'auto', padding: 20, flex: 1 },
  detailHero: {
    paddingBottom: 18,
    borderBottom: '1px solid #1a2a44',
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column'
  },
  detailDosyaNo: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 22,
    fontWeight: 700,
    color: '#e8c5a8',
    letterSpacing: 1
  },
  detailDaire: { fontSize: 13, color: '#8a9bb4', marginTop: 6 },
  detailSection: { marginBottom: 22 },
  detailLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailLabel: {
    fontSize: 10,
    color: '#5a6b87',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: 700,
    marginBottom: 10
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(42, 58, 82, 0.4)',
    fontSize: 13,
    gap: 12
  },
  detailKey: { color: '#8a9bb4', flexShrink: 0 },
  detailVal: { color: '#e8eef7', textAlign: 'right', flex: 1 },
  notlar: {
    background: '#0a1424',
    border: '1px solid #1f2f4a',
    borderLeft: '3px solid #e8c5a8',
    padding: 12,
    borderRadius: 6,
    fontSize: 13,
    color: '#c8d4e8',
    lineHeight: 1.5
  },
  linkBtn: {
    background: 'transparent',
    color: '#e8c5a8',
    border: '1px solid #e8c5a8',
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  emptyMini: {
    color: '#5a6b87',
    fontSize: 12,
    fontStyle: 'italic',
    padding: '12px 0'
  },
  miniTask: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid rgba(42, 58, 82, 0.4)'
  },
  miniTaskTitle: { fontSize: 13, color: '#e8eef7', lineHeight: 1.4 },
  miniTaskMeta: { fontSize: 11, color: '#5a6b87', marginTop: 3 },
  dangerBtn: {
    width: '100%',
    background: 'transparent',
    color: '#e8a8a8',
    border: '1px solid #3d2929',
    padding: '12px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  confirmBox: {
    background: 'rgba(61, 31, 31, 0.3)',
    border: '1px solid #3d2929',
    borderRadius: 10,
    padding: 14
  },
  confirmBtnNo: {
    flex: 1,
    background: '#1a2a44',
    color: '#c8d4e8',
    border: 'none',
    padding: '10px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600
  },
  confirmBtnYes: {
    flex: 1,
    background: '#d44a4a',
    color: '#fff',
    border: 'none',
    padding: '10px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600
  },
  formField: { marginBottom: 16 },
  formLabel: {
    display: 'block',
    fontSize: 11,
    color: '#8a9bb4',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: 600
  },
  formInput: {
    width: '100%',
    padding: '11px 12px',
    background: '#0a1424',
    border: '1px solid #2a3a52',
    borderRadius: 10,
    color: '#e8eef7',
    fontSize: 14,
    transition: 'border-color 0.2s'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  },
  toast: {
    position: 'fixed',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #1f3d1f 0%, #2a4f2a 100%)',
    color: '#a8e8a8',
    padding: '12px 18px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    border: '1px solid #2a4f2a',
    animation: 'slideUp 0.3s ease',
    zIndex: 200
  }
};
