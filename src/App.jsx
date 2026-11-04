import { useEffect, useMemo, useState } from 'react'
import { useTasks } from './hooks/useTasks'
import taskService from './services/taskService.js'
import {
  LayoutDashboard, ClipboardList, User, Info, Plus, Search, Pencil,
  Trash2, CheckCircle2, Circle, CalendarDays, BookOpen, Clock3, Menu, X,
  GraduationCap, Sparkles, Filter, ArrowUpRight
} from 'lucide-react'

const PROFILE_KEY = 'studymate-profile-v1'
const defaultProfile = { name: '', nim: '', group: '', major: '' }
const today = () => new Date().toISOString().slice(0, 10)
const readStorage = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback }
  catch { return fallback }
}
const formatDate = (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum ditentukan'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const { tasks, loading, error, fetchTasks } = useTasks()
  const [profile, setProfile] = useState(() => readStorage(PROFILE_KEY, null))
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Semua')
  const [editing, setEditing] = useState(null)
  const [modal, setModal] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(PROFILE_KEY)
  }, [profile])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.done).length,
    pending: tasks.filter(t => !t.done).length,
    overdue: tasks.filter(t => !t.done && t.due && t.due < today()).length
  }), [tasks])

  const filteredTasks = tasks.filter(task => {
    const matchSearch = `${task.title} ${task.subject}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Semua' || (filter === 'Selesai' ? task.done : filter === 'Belum selesai' ? !task.done : task.priority === filter)
    return matchSearch && matchFilter
  })

  const navigate = (next) => { setPage(next); setMobileMenu(false) }
  const openNew = () => { setEditing(null); setModal(true) }
  const openEdit = (task) => { setEditing(task); setModal(true) }
  const saveTask = async (task) => {
    const payload = {
      title: task.title,
      subject: task.subject || '',
      due: task.due || null,
      priority: task.priority || 'Sedang',
      notes: task.notes || '',
      done: Boolean(task.done),
    }

    try {
      if (editing) {
        await taskService.updateTask(editing.id, payload)
        setToast('Tugas berhasil diperbarui.')
      } else {
        await taskService.createTask({ ...payload, done: false })
        setToast('Tugas berhasil ditambahkan.')
      }
      await fetchTasks()
      setModal(false)
      setEditing(null)
    } catch (err) {
      console.error('Gagal menyimpan tugas:', err)
      setToast('Gagal menyimpan tugas. Periksa koneksi/API Supabase.')
    }
  }

  const deleteTask = async (id) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return
    try {
      await taskService.deleteTask(id)
      await fetchTasks()
      setToast('Tugas berhasil dihapus.')
    } catch (err) {
      console.error('Gagal menghapus tugas:', err)
      setToast('Gagal menghapus tugas dari database.')
    }
  }

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    try {
      await taskService.updateTask(id, { done: !task.done })
      await fetchTasks()
    } catch (err) {
      console.error('Gagal mengubah status tugas:', err)
      setToast('Gagal mengubah status tugas.')
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Manajemen Tugas', icon: ClipboardList },
    { id: 'profile', label: 'Profil Mahasiswa', icon: User },
    { id: 'about', label: 'Tentang Aplikasi', icon: Info }
  ]

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-icon"><GraduationCap size={24}/></div><div><b>StudyMate</b><span>Student Workspace</span></div><button className="close-menu" onClick={() => setMobileMenu(false)}><X/></button></div>
      <div className="nav-label">MENU UTAMA</div>
      <nav>{navItems.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={19}/><span>{item.label}</span>{page === item.id && <span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="mini-card"><Sparkles size={17}/><div><b>Keep it organized</b><span>Langkah kecil, hasil besar.</span></div></div><div className="sidebar-user"><div className="avatar">{(profile?.name || 'M').charAt(0).toUpperCase()}</div><div className="user-info"><b>{profile?.name || 'Mahasiswa'}</b><span>Kelompok {profile?.group || '-'}</span></div><button title="Buka profil" onClick={() => navigate('profile')}><ArrowUpRight size={17}/></button></div></div>
    </aside>

    {mobileMenu && <div className="overlay" onClick={() => setMobileMenu(false)}/>}
    <main className="main">
      <header className="topbar"><button className="menu-toggle" onClick={() => setMobileMenu(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{navItems.find(n => n.id === page)?.label}</b></div><div className="top-right"><span className="online"><span/> Offline-ready PWA</span><div className="avatar small">{(profile?.name || 'M').charAt(0).toUpperCase()}</div></div></header>
      <div className="content">
        {loading && <div className="panel"><p>Memuat tugas dari Supabase...</p></div>}
        {!loading && error && <div className="panel"><p>{error}</p><button className="primary-btn" onClick={fetchTasks}>Coba Lagi</button></div>}
        {!loading && !error && <>
          {page === 'dashboard' && <Dashboard tasks={tasks} stats={stats} navigate={navigate} openNew={openNew} toggleTask={toggleTask}/>}
          {page === 'tasks' && <Tasks tasks={filteredTasks} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} openNew={openNew} openEdit={openEdit} deleteTask={deleteTask} toggleTask={toggleTask}/>}
          {page === 'profile' && <Profile profile={profile} setProfile={setProfile} setToast={setToast}/>}
          {page === 'about' && <About/>}
        </>}
      </div>
      <footer>© 2026 StudyMate <span>Built for better learning habits.</span></footer>
    </main>
    {modal && <TaskModal initial={editing} onSave={saveTask} onClose={() => setModal(false)}/>}
    {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>
}
function Dashboard({ tasks, stats, navigate, openNew, toggleTask }) {
  const upcoming = tasks.filter(t => !t.done).sort((a,b) => (a.due || '9999').localeCompare(b.due || '9999')).slice(0, 4)
  const percent = stats.total ? Math.round(stats.done / stats.total * 100) : 0
  return <>
    <PageHeading eyebrow="OVERVIEW" title="Selamat datang di StudyMate 👋" subtitle="Atur tugas kuliahmu dan tetap produktif setiap hari." action={<button className="primary-btn" onClick={openNew}><Plus size={18}/> Tambah Tugas</button>}/>
    <div className="welcome-banner"><div><span className="banner-tag"><Sparkles size={14}/> YOUR STUDY SPACE</span><h2>Belajar lebih teratur,<br/>jalani hari lebih ringan.</h2><p>Semua tugas dan target kuliahmu dalam satu tempat.</p><button className="banner-btn" onClick={() => navigate('tasks')}>Lihat semua tugas <ArrowUpRight size={16}/></button></div><div className="banner-art"><div className="art-circle"><BookOpen size={54}/></div><div className="floating-note note-one"><CheckCircle2/> Stay focused</div><div className="floating-note note-two"><CalendarDays/> Plan your day</div></div></div>
    <div className="stats-grid">
      <Stat title="Total Tugas" value={stats.total} icon={ClipboardList} tone="purple" note="Semua tugas tersimpan"/>
      <Stat title="Belum Selesai" value={stats.pending} icon={Clock3} tone="orange" note="Perlu dikerjakan"/>
      <Stat title="Sudah Selesai" value={stats.done} icon={CheckCircle2} tone="green" note="Good job!"/>
      <Stat title="Terlambat" value={stats.overdue} icon={CalendarDays} tone="red" note="Lewat tenggat"/>
    </div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h3>Tugas Mendatang</h3><p>Prioritas yang perlu kamu selesaikan</p></div><button className="text-btn" onClick={() => navigate('tasks')}>Lihat semua</button></div>{upcoming.length ? <div className="task-list">{upcoming.map(task => <TaskRow key={task.id} task={task} toggleTask={toggleTask}/>)}</div> : <Empty text="Tidak ada tugas yang menunggu. Santai dulu!"/>}</section>
      <section className="panel progress-panel"><div className="panel-head"><div><h3>Progress Belajar</h3><p>Perkembangan tugasmu</p></div><span className="soft-badge">Minggu ini</span></div><div className="progress-circle" style={{'--progress': `${percent * 3.6}deg`}}><div><strong>{percent}%</strong><span>selesai</span></div></div><div className="progress-caption"><b>{stats.done} dari {stats.total} tugas</b><span>{percent === 100 ? 'Semua tugas selesai!' : 'Terus semangat, kamu pasti bisa!'}</span></div><div className="progress-bar"><span style={{width: `${percent}%`}}/></div><button className="secondary-btn full" onClick={() => navigate('tasks')}>Kelola tugas <ArrowUpRight size={16}/></button></section></div>
  </>
}
function Stat({ title, value, icon: Icon, tone, note }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><span className="stat-title">{title}</span><strong>{value}</strong><small>{note}</small></div> }
function TaskRow({ task, toggleTask }) { return <div className={`task-row ${task.done ? 'task-done' : ''}`}><button className="check-btn" onClick={() => toggleTask(task.id)}>{task.done ? <CheckCircle2 size={21}/> : <Circle size={21}/>}</button><div className="task-row-main"><b>{task.title}</b><span>{task.subject || 'Tanpa mata kuliah'}</span></div><div className="task-row-date"><CalendarDays size={14}/>{formatDate(task.due)}</div><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div> }
function Empty({ text }) { return <div className="empty"><ClipboardList size={32}/><p>{text}</p></div> }

function Tasks({ tasks, search, setSearch, filter, setFilter, openNew, openEdit, deleteTask, toggleTask }) {
  return <>
    <PageHeading eyebrow="TASK MANAGER" title="Manajemen Tugas" subtitle="Catat, atur, dan selesaikan semua tugas kuliahmu." action={<button className="primary-btn" onClick={openNew}><Plus size={18}/> Tambah Tugas</button>}/>
    <div className="task-toolbar"><div className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari tugas atau mata kuliah..."/></div><div className="filter-box"><Filter size={17}/><select value={filter} onChange={e => setFilter(e.target.value)}><option>Semua</option><option>Belum selesai</option><option>Selesai</option><option>Tinggi</option><option>Sedang</option><option>Rendah</option></select></div></div>
    <div className="tasks-table panel"><div className="table-head"><span>TUGAS</span><span>MATA KULIAH</span><span>DEADLINE</span><span>PRIORITAS</span><span>STATUS</span><span>AKSI</span></div>
      {tasks.length ? tasks.map(task => <div className="table-row" key={task.id}><div className="task-title-cell"><button className={`check-btn ${task.done ? 'checked' : ''}`} onClick={() => toggleTask(task.id)}>{task.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><b className={task.done ? 'line-through' : ''}>{task.title}</b></div><span className="subject-cell">{task.subject || '-'}</span><span className="date-cell">{formatDate(task.due)}</span><span><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></span><span><span className={`status ${task.done ? 'completed' : 'pending'}`}>{task.done ? 'Selesai' : 'Berjalan'}</span></span><div className="action-cell"><button title="Edit tugas" onClick={() => openEdit(task)}><Pencil size={16}/></button><button title="Hapus tugas" className="delete-action" onClick={() => deleteTask(task.id)}><Trash2 size={16}/></button></div></div>) : <Empty text="Tugas tidak ditemukan. Coba ubah pencarian atau filter."/>}
    </div><div className="table-foot">Menampilkan {tasks.length} tugas</div>
  </>
}
function Profile({ profile, setProfile, setToast }) {
  const emptyProfile = { name: '', nim: '', group: '', major: '' }
  const [form, setForm] = useState(profile || emptyProfile)
  const [editing, setEditing] = useState(!profile)
  useEffect(() => { setForm(profile || emptyProfile); setEditing(!profile) }, [profile])
  const change = e => setForm({ ...form, [e.target.name]: e.target.value })
  const save = e => {
    e.preventDefault()
    setProfile({ ...form })
    setEditing(false)
    setToast(profile ? 'Profil berhasil diperbarui.' : 'Profil berhasil ditambahkan.')
  }
  const deleteProfile = () => {
    if (confirm('Yakin ingin menghapus data profil mahasiswa?')) {
      setProfile(null); setForm(emptyProfile); setEditing(true)
      setToast('Profil mahasiswa berhasil dihapus.')
    }
  }
  return <>
    <PageHeading eyebrow="STUDENT PROFILE" title="Profil Mahasiswa" subtitle="Kelola data identitas mahasiswa. Data awal kosong dan dapat ditambahkan kapan saja."
      action={profile && !editing ? <button className="primary-btn" onClick={() => setEditing(true)}><Pencil size={16}/> Edit Profil</button> : null}/>
    {!profile && !editing && <div className="panel empty-profile"><User size={34}/><h3>Belum ada profil mahasiswa</h3><p>Tambahkan data nama, NIM, dan kelompok untuk memulai.</p><button className="primary-btn" onClick={() => setEditing(true)}><Plus size={17}/> Tambah Profil</button></div>}
    {profile && !editing && <div className="profile-layout">
      <div className="profile-card panel"><div className="profile-cover"><div className="profile-avatar">{(profile.name || 'M').charAt(0).toUpperCase()}</div></div><h2>{profile.name}</h2><p>{profile.major || 'Program Studi belum diisi'}</p><span className="profile-group">Kelompok {profile.group || '-'}</span><div className="profile-meta"><div><span>NIM</span><b>{profile.nim || '-'}</b></div><div><span>Kelompok</span><b>{profile.group || '-'}</b></div></div></div>
      <div className="panel profile-form profile-details"><div className="panel-head"><div><h3>Detail Profil</h3><p>Data mahasiswa yang tersimpan.</p></div></div>
        <div className="profile-detail-row"><span>Nama Lengkap</span><b>{profile.name}</b></div><div className="profile-detail-row"><span>NIM</span><b>{profile.nim || '-'}</b></div><div className="profile-detail-row"><span>Kelompok Praktikum</span><b>{profile.group || '-'}</b></div><div className="profile-detail-row"><span>Program Studi</span><b>{profile.major || '-'}</b></div>
        <div className="profile-actions"><button className="primary-btn" onClick={() => setEditing(true)}><Pencil size={16}/> Edit Profil</button><button className="danger-btn" onClick={deleteProfile}><Trash2 size={16}/> Hapus Profil</button></div>
      </div>
    </div>}
    {editing && <div className="profile-layout">
      <div className="profile-card panel"><div className="profile-cover"><div className="profile-avatar">{(form.name || 'M').charAt(0).toUpperCase()}</div></div><h2>{form.name || 'Nama Mahasiswa'}</h2><p>{form.major || 'Program Studi'}</p><span className="profile-group">Kelompok {form.group || '-'}</span><div className="profile-meta"><div><span>NIM</span><b>{form.nim || 'Belum diisi'}</b></div><div><span>Kelompok</span><b>{form.group || 'Belum diisi'}</b></div></div></div>
      <form className="panel profile-form" onSubmit={save}><div className="panel-head"><div><h3>{profile ? 'Edit Profil Mahasiswa' : 'Tambah Profil Mahasiswa'}</h3><p>Isi informasi identitas mahasiswa.</p></div></div>
        <label>Nama Lengkap *<input name="name" value={form.name} onChange={change} required placeholder="Nama lengkap"/></label><label>Nomor Induk Mahasiswa (NIM) *<input name="nim" value={form.nim} onChange={change} required placeholder="Masukkan NIM"/></label><label>Kelompok Praktikum *<input name="group" value={form.group} onChange={change} required placeholder="Contoh: 30"/></label><label>Program Studi<input name="major" value={form.major} onChange={change} placeholder="Program studi"/></label>
        <div className="profile-actions"><button className="primary-btn" type="submit"><CheckCircle2 size={16}/> {profile ? 'Simpan Perubahan' : 'Simpan Profil'}</button>{profile && <button type="button" className="secondary-btn" onClick={() => { setForm(profile); setEditing(false) }}>Batal</button>}</div>
      </form>
    </div>}
  </>
}
function About() {
  return <><PageHeading eyebrow="ABOUT STUDYMATE" title="Tentang Aplikasi" subtitle="Kenali StudyMate dan teknologi yang digunakan."/>
    <div className="about-hero panel"><div className="about-logo"><GraduationCap size={42}/></div><h2>StudyMate</h2><span className="about-version">Version 1.0.0 · Progressive Web App</span><p>StudyMate adalah aplikasi manajemen tugas mahasiswa yang membantu mencatat deadline, memantau progres, dan mengatur aktivitas akademik dengan lebih mudah.</p></div>
    <div className="about-grid"><div className="panel about-feature"><div className="stat-icon purple"><ClipboardList/></div><h3>Manajemen Tugas</h3><p>Tambah, baca, ubah, dan hapus tugas kuliah dengan mudah.</p></div><div className="panel about-feature"><div className="stat-icon green"><CheckCircle2/></div><h3>Offline Support</h3><p>Data disimpan secara lokal dan aplikasi bisa dibuka saat offline setelah dimuat.</p></div><div className="panel about-feature"><div className="stat-icon orange"><Sparkles/></div><h3>Installable</h3><p>Pasang StudyMate ke perangkat melalui browser yang mendukung PWA.</p></div></div>
    <div className="panel tech-panel"><h3>Teknologi yang digunakan</h3><div className="tech-tags"><span>React</span><span>Vite</span><span>JavaScript</span><span>LocalStorage</span><span>Service Worker</span><span>Vercel</span></div></div>
  </>
}
function TaskModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { title: '', subject: '', due: '', priority: 'Sedang', notes: '' })
  const change = e => setForm({...form, [e.target.name]: e.target.value})
  const submit = e => { e.preventDefault(); onSave({...form, done: initial?.done || false}) }
  return <div className="modal-backdrop" onClick={onClose}><form className="task-modal" onClick={e => e.stopPropagation()} onSubmit={submit}><div className="modal-head"><div><h2>{initial ? 'Edit Tugas' : 'Tambah Tugas Baru'}</h2><p>Lengkapi informasi tugas kuliah.</p></div><button type="button" className="icon-button" onClick={onClose}><X/></button></div><label>Nama Tugas *<input name="title" value={form.title} onChange={change} required placeholder="Contoh: Laporan praktikum"/></label><label>Mata Kuliah<input name="subject" value={form.subject} onChange={change} placeholder="Nama mata kuliah"/></label><div className="form-row"><label>Deadline<input name="due" type="date" value={form.due} onChange={change}/></label><label>Prioritas<select name="priority" value={form.priority} onChange={change}><option>Tinggi</option><option>Sedang</option><option>Rendah</option></select></label></div><label>Catatan<textarea name="notes" rows="3" value={form.notes} onChange={change} placeholder="Catatan tambahan (opsional)"/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Batal</button><button type="submit" className="primary-btn">{initial ? 'Simpan Perubahan' : 'Tambah Tugas'}</button></div></form></div>
}