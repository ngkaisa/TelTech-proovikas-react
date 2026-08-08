import { BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { getCancellations, getTuhistamisedStats } from '../../BronStatisticsService';
import KpiKaart from '../../components/bron/KpiKaart';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const SEKKUMISE_KLASSID = [
    { key: 'lt15',    label: '< 15 min',   color: '#991b1b' },
    { key: 'lt60',    label: '15–60 min',  color: '#e4067e' },
    { key: 'lt240',   label: '1–4 h',      color: '#db2777' },
    { key: 'lt1440',  label: '4–24 h',     color: '#f59e0b' },
    { key: 'lt4320',  label: '1–3 päeva',  color: '#10b981' },
    { key: 'gte4320', label: '3+ päeva',   color: '#065f46' },
];

const PAEVA_NIMED = { 1: 'Esmasp.', 2: 'Teisip.', 3: 'Kolmap.', 4: 'Neljap.', 5: 'Reede', 6: 'Laup.', 7: 'Pühap.' };

function fmt(iso) {
    return new Date(iso).toLocaleString('et-EE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtMin(m) {
    if (m == null) return '—';
    if (m < 60) return m + ' min';
    if (m < 1440) return (m / 60).toFixed(0) + ' h';
    return (m / 1440).toFixed(0) + ' p';
}

export default function StatistikaTuhistamised({ filters = {} }) {
    const stats = getTuhistamisedStats(filters);
    const details = getCancellations(filters);
    const navigate = useNavigate();

    const klassiData = {
        labels: SEKKUMISE_KLASSID.map(k => k.label),
        datasets: [{
            label: 'Tühistamisi',
            data: SEKKUMISE_KLASSID.map(k => stats.byClass[k.key] || 0),
            backgroundColor: SEKKUMISE_KLASSID.map(k => k.color),
        }],
    };

    const weekdayData = {
        labels: [1,2,3,4,5,6,7].map(d => PAEVA_NIMED[d]),
        datasets: [{
            label: 'Tühistamisi',
            data: [1,2,3,4,5,6,7].map(d => details.by_weekday[d] || 0),
            backgroundColor: '#e4067e',
            borderRadius: 3,
        }],
    };

    const hourLabels = Object.keys(details.by_hour).map(h => h + ':00');
    const hourData = {
        labels: hourLabels,
        datasets: [{
            label: 'Tühistamisi',
            data: Object.values(details.by_hour),
            backgroundColor: '#4c3f8a',
            borderRadius: 3,
        }],
    };

    const chartOpts = { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } };

    return (
        <div>
            {/* KPI rida */}
            <div className="bron-kpi-grid" style={{ marginBottom: '1rem' }}>
                <KpiKaart value={stats.kokku} label="Tühistamisi kokku" variant="red"
                    legend={'Tühistamisi kokku = perioodil tühistatud broneeringute arv\nSisaldab: kasutaja ise tühistas + haldur/super tühistas\nEi sisalda: menetlusel (ghost) ega lõppenud broneeringuid'} />
                <KpiKaart value={(stats.tuhistamine_pct * 100).toFixed(1) + '%'} label="Tühistamise määr" variant="amber"
                    legend={'Tühistamise määr % = tühistatud ÷ (tühistatud + lõppenud) × 100\nNäitab kui suur osa broneeringutest ei toimunud plaanipäraselt\nMida väiksem, seda usaldusväärsemad kasutajate broneeringud'} />
                <KpiKaart value={stats.avg_enne_h != null ? stats.avg_enne_h.toFixed(1) + ' h' : '—'} label="Keskm. tühistamise kaugus"
                    legend={'Keskmine tühistamise kaugus = tühistamismomendi ja broneeringu alguse vahe keskmisena (tundides)\nPikem kaugus = kasutajad teatavad varakult → ruum jõuab uuele kasutajale\nLühem kaugus (< 1 h) = ruum jääb broneerituks kuid kasutamata'} />
            </div>

            {/* Graafikute rida */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="bron-tuhistamised-grid">
                <div className="bron-card">
                    <h3 style={{ margin: '0 0 .5rem', fontSize: '.88rem', color: 'var(--tt-purple-500)' }}>Kui kaua enne tühistati</h3>
                    <p style={{ margin: '0 0 .6rem', fontSize: '.77rem', color: '#6b7280' }}>
                        Varajane tühistamine (3+ päeva) vabastab ruumi teistele. Hiline (&lt; 15 min) jätab ruumi kasutamata.
                    </p>
                    <Bar data={klassiData} options={chartOpts} height={130} />
                </div>

                <div className="bron-card">
                    <h3 style={{ margin: '0 0 .5rem', fontSize: '.88rem', color: 'var(--tt-purple-500)' }}>Tühistamised nädalapäeva järgi</h3>
                    <p style={{ margin: '0 0 .6rem', fontSize: '.77rem', color: '#6b7280' }}>
                        Osakaal nädalapäeval = sellel päeval tühistatud ÷ kõik tühistatud × 100
                    </p>
                    <Bar data={weekdayData} options={chartOpts} height={130} />
                </div>

                <div className="bron-card">
                    <h3 style={{ margin: '0 0 .5rem', fontSize: '.88rem', color: 'var(--tt-purple-500)' }}>Tühistamised kellaaja järgi</h3>
                    <p style={{ margin: '0 0 .6rem', fontSize: '.77rem', color: '#6b7280' }}>
                        Osakaal tunnis = selles tunnis tühistatud ÷ kõik tühistatud × 100
                    </p>
                    <Bar data={hourData} options={chartOpts} height={130} />
                </div>
            </div>

            {/* Viimaste tühistamiste tabel */}
            <div className="bron-card">
                <h3 style={{ margin: '0 0 .75rem', fontSize: '.88rem', color: 'var(--tt-purple-500)' }}>
                    Viimased tühistamised — ruum, hoone, tüüp, ajastus
                </h3>
                <div className="bron-table-wrap">
                    <table className="bron-table">
                        <thead>
                            <tr>
                                <th>Broneeringu algus</th>
                                <th>Nädalapäev</th>
                                <th>Kellaaeg</th>
                                <th>Tühistati enne</th>
                                <th>Ruum</th>
                                <th>Hoone</th>
                                <th>Ruumitüüp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.recent.map(b => (
                                <tr key={b.id} style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/statistika/ruumid/${b.ruum_id}`)}>
                                    <td>{fmt(b.algus)}</td>
                                    <td>{b.nadalapaev}</td>
                                    <td>{b.kellaaeg}</td>
                                    <td>
                                        <span style={{
                                            fontSize: '.75rem', fontWeight: 600, padding: '.1rem .4rem',
                                            borderRadius: 10,
                                            background: (b.tuhistatud_enne_min ?? 9999) < 60 ? '#fee2e2' : (b.tuhistatud_enne_min ?? 9999) < 1440 ? '#fef3c7' : '#d1fae5',
                                            color: (b.tuhistatud_enne_min ?? 9999) < 60 ? '#991b1b' : (b.tuhistatud_enne_min ?? 9999) < 1440 ? '#92400e' : '#065f46',
                                        }}>
                                            {fmtMin(b.tuhistatud_enne_min)}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--tt-purple-500)', fontWeight: 500 }}>{b.ruum}</td>
                                    <td>{b.hoone}</td>
                                    <td style={{ fontSize: '.78rem', color: '#6b7280' }}>{b.ruumitypp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
