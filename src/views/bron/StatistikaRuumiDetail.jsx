import { BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useNavigate, useParams } from 'react-router-dom';
import { getRoomFeedback } from '../../BronBookingsService';
import { getKpiSummary, getRoomDetail, RUUMID } from '../../BronStatisticsService';
import BronBreadcrumbs from '../../components/bron/BronBreadcrumbs';
import KpiKaart from '../../components/bron/KpiKaart';
import LigipaasPuudub from '../../components/bron/LigipaasPuudub';
import { useRole } from '../../context/RoleContext';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

function pct(v) { return (+v).toFixed(1) + '%'; }
function fmt(iso) {
    return new Date(iso).toLocaleString('et-EE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function avgFb(fb) {
    return ((fb.temperatuur + fb.puhtus + fb.ohk + fb.varustus) / 4).toFixed(1);
}

export default function StatistikaRuumiDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { canSeeFullStatistics } = useRole();

    if (!canSeeFullStatistics) return <LigipaasPuudub />;

    const room = RUUMID.find(r => r.id === id);
    if (!room) return <div className="bron-page"><h1>Ruum ei leitud</h1></div>;

    const kpi = getKpiSummary({ ruum_id: id });
    const detail = getRoomDetail(id);
    const feedback = getRoomFeedback(id);

    const trend = detail?.trend ?? [];
    const bySyndmus = detail?.by_syndmus ?? {};
    const broneeringud = (detail?.broneeringud ?? []).slice(0, 15);

    const trendData = {
        labels: trend.slice(-14).map(t => t.date?.slice(5) ?? ''),
        datasets: [{
            label: 'Broneeringuid',
            data: trend.slice(-14).map(t => t.count ?? 0),
            backgroundColor: '#342b60',
            borderRadius: 3,
        }],
    };

    const syndmuseJarjestus = Object.entries(bySyndmus).sort((a, b) => b[1] - a[1]);
    const syndmuseTotal = syndmuseJarjestus.reduce((s, [, v]) => s + v, 0);
    const fbAvg = feedback.length > 0
        ? (feedback.reduce((s, fb) => s + parseFloat(avgFb(fb)), 0) / feedback.length).toFixed(1)
        : null;

    return (
        <div className="bron-page">
            <BronBreadcrumbs items={[
                { label: 'Avaleht', to: '/' },
                { label: 'Statistika', to: '/statistika' },
                { label: 'Ruumide kasutus', to: '/statistika?tab=ruumid' },
                { label: room.code },
            ]} />

            <div className="bron-page-header">
                <div>
                    <h1>{room.code}</h1>
                    <p>{room.ruumitypp_label} · {room.hoone_name} · {room.kohti} kohta{room.arvutikohti ? ` · ${room.arvutikohti} arvutikohta` : ''}</p>
                </div>
                <button className="bron-btn bron-btn-secondary" onClick={() => navigate(-1)}>← Tagasi</button>
            </div>

            {/* KPI kaardid */}
            <div className="bron-kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <KpiKaart value={pct(kpi.broneeritud_pct)} label="Broneeritud kasutus" />
                <KpiKaart value={pct(kpi.tegelik_pct)} label="Tegelik kasutus" variant="green" />
                <KpiKaart value={pct(kpi.kasutamata_pct)} label="Kasutamata" variant="amber" />
                <KpiKaart value={kpi.tuhistatud_arv} label="Tühistamisi" variant="red" />
                <KpiKaart value={kpi.broneeringute_arv} label="Broneeringuid" />
                <KpiKaart value={room.kohti} label="Mahutavus" />
            </div>

            {/* Trend + sündmuste jaotus */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="bron-otsi-grid">
                <div className="bron-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '.92rem', color: 'var(--tt-purple-500)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <span className="material-icons" style={{ fontSize: '1rem' }}>trending_up</span>
                        Broneeringute trend (viimased 14 päeva)
                    </h3>
                    {trend.length > 0 ? (
                        <Bar data={trendData} options={{
                            responsive: true, maintainAspectRatio: true,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { ticks: { font: { size: 10 } } },
                                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
                            },
                        }} height={80} />
                    ) : (
                        <div className="bron-empty" style={{ padding: '1.5rem' }}>Trendiandmed puuduvad</div>
                    )}
                </div>

                <div className="bron-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '.92rem', color: 'var(--tt-purple-500)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <span className="material-icons" style={{ fontSize: '1rem' }}>pie_chart</span>
                        Sündmuste jaotus
                    </h3>
                    {syndmuseJarjestus.length === 0 ? (
                        <div className="bron-empty" style={{ padding: '1rem' }}>Andmed puuduvad</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {syndmuseJarjestus.map(([label, count]) => (
                                <div key={label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.2rem' }}>
                                        <span style={{ color: 'var(--tt-text-muted)' }}>{label}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--tt-purple-500)' }}>{count}</span>
                                    </div>
                                    <div style={{ height: 5, background: '#ededf4', borderRadius: 3 }}>
                                        <div style={{ width: `${(count / syndmuseTotal * 100).toFixed(0)}%`, height: '100%', background: 'var(--tt-purple-500)', borderRadius: 3 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tagasiside */}
            <div className="bron-card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '.92rem', color: 'var(--tt-purple-500)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <span className="material-icons" style={{ fontSize: '1rem' }}>star_rate</span>
                    Kasutajate tagasiside
                    {fbAvg && <span style={{ marginLeft: '.5rem', fontWeight: 400, fontSize: '.8rem', color: 'var(--tt-text-muted)' }}>⌀ {fbAvg} · {feedback.length} hinnangut</span>}
                </h3>
                {feedback.length === 0 ? (
                    <div className="bron-empty" style={{ padding: '1rem' }}>Tagasiside puudub</div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1rem' }}>
                            {[
                                { key: 'temperatuur', label: 'Temperatuur', icon: 'thermostat' },
                                { key: 'puhtus',      label: 'Puhtus',       icon: 'cleaning_services' },
                                { key: 'ohk',         label: 'Õhk',          icon: 'air' },
                                { key: 'varustus',    label: 'Varustus',     icon: 'devices' },
                            ].map(({ key, label, icon }) => {
                                const avg = (feedback.reduce((s, fb) => s + fb[key], 0) / feedback.length).toFixed(1);
                                const color = avg >= 4 ? '#147a52' : avg >= 3 ? '#b45309' : '#c41c1c';
                                return (
                                    <div key={key} style={{ textAlign: 'center', padding: '.65rem', background: '#f9f9fc', borderRadius: 6 }}>
                                        <span className="material-icons" style={{ fontSize: '1.1rem', color: 'var(--tt-purple-300)', display: 'block', marginBottom: '.2rem' }}>{icon}</span>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{avg} ★</div>
                                        <div style={{ fontSize: '.72rem', color: 'var(--tt-text-muted)' }}>{label}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                            {feedback.filter(fb => fb.kommentaar).slice(0, 5).map(fb => {
                                const avg = parseFloat(avgFb(fb));
                                return (
                                    <div key={fb.id} style={{ padding: '.6rem .8rem', background: '#f9f9fc', borderRadius: 6, borderLeft: `3px solid ${avg < 2.5 ? '#c41c1c' : 'var(--tt-purple-300)'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '.83rem' }}>{fb.kasutaja}</span>
                                            <span style={{ fontSize: '.78rem', color: avg < 2.5 ? '#c41c1c' : avg < 3.5 ? '#b45309' : '#147a52', fontWeight: 700 }}>⌀ {avgFb(fb)} ★</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--tt-text-muted)', fontStyle: 'italic' }}>„{fb.kommentaar}"</p>
                                        <div style={{ fontSize: '.72rem', color: 'var(--tt-text-light)', marginTop: '.2rem' }}>{fb.kuupaev}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Viimased broneeringud */}
            <div className="bron-card">
                <h3 style={{ margin: '0 0 1rem', fontSize: '.92rem', color: 'var(--tt-purple-500)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <span className="material-icons" style={{ fontSize: '1rem' }}>history</span>
                    Viimased broneeringud
                </h3>
                {broneeringud.length === 0 ? (
                    <div className="bron-empty" style={{ padding: '1rem' }}>Broneeringuid pole</div>
                ) : (
                    <div className="bron-table-wrap">
                        <table className="bron-table">
                            <thead>
                                <tr><th>Algus</th><th>Lõpp</th><th>Sündmus</th><th>Allikas</th><th>Andur</th><th>Staatus</th></tr>
                            </thead>
                            <tbody>
                                {broneeringud.map(b => (
                                    <tr key={b.id}>
                                        <td>{fmt(b.algus)}</td>
                                        <td>{fmt(b.lopp)}</td>
                                        <td>{b.syndmus_label}</td>
                                        <td>
                                            <span style={{ fontSize: '.72rem', fontWeight: 600, padding: '.15rem .5rem', borderRadius: 20, background: b.allikas === 'tunniplaan' ? '#dbeafe' : '#f3f0ff', color: b.allikas === 'tunniplaan' ? '#1e40af' : 'var(--tt-purple-500)' }}>
                                                {b.allikas === 'tunniplaan' ? 'Tunniplaan' : 'Kasutaja'}
                                            </span>
                                        </td>
                                        <td title={b.staatus === 'loppenud' ? (b.andur_kasutusel ? 'Andur tuvastas kasutuse' : 'Andur ei tuvastanud kasutust') : '—'}>
                                            {b.staatus === 'loppenud' ? (
                                                <span style={{ fontSize: '.72rem', fontWeight: 600, padding: '.15rem .5rem', borderRadius: 20, background: b.andur_kasutusel ? '#d1fae5' : '#fee2e2', color: b.andur_kasutusel ? '#065f46' : '#991b1b' }}>
                                                    {b.andur_kasutusel ? '✓ kasutuses' : '✗ tühi'}
                                                </span>
                                            ) : <span style={{ color: '#9ca3af', fontSize: '.72rem' }}>—</span>}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '.72rem', fontWeight: 600, padding: '.15rem .5rem', borderRadius: 20, background: b.staatus === 'tuhistatud' ? '#fee2e2' : b.staatus === 'loppenud' ? '#f3f4f6' : '#d1fae5', color: b.staatus === 'tuhistatud' ? '#991b1b' : b.staatus === 'loppenud' ? '#6b7280' : '#065f46' }}>
                                                {b.staatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
