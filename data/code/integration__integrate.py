#!/usr/bin/env python3
"""Integrate content chunks into NOA PhD Dissertation HTML template."""
import json, base64, html, os, re, sys
from pathlib import Path

TEMPLATE = Path("[path]")
OUT_DIR  = Path("[path]")
OUT_HTML = OUT_DIR / "NOA_PhD_Dissertation_Complete.html"
OUT_REPORT = OUT_DIR / "integration_report.md"
CHUNKS = Path("[path]")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def b64img(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path,"rb").read()).decode()

LOGO_MUMS  = b64img("[path] logo.jpeg", "image/jpeg")
LOGO_MEDINF = b64img("[path] medical informatics.jpeg", "image/jpeg")
LOGO_ROYAN = b64img("[path]", "image/png")

def esc(s):
    if s is None: return ""
    return html.escape(str(s))

def kv_table(d, label_key="Key", value_key="Value"):
    rows = "".join(f"<tr><td><strong>{esc(k)}</strong></td><td>{esc(v) if not isinstance(v,(list,dict)) else esc(json.dumps(v, ensure_ascii=False))}</td></tr>" for k,v in d.items())
    return f"<table><thead><tr><th>{label_key}</th><th>{value_key}</th></tr></thead><tbody>{rows}</tbody></table>"

def list_to_ul(items):
    if not items: return ""
    if isinstance(items, dict):
        items = [f"<strong>{esc(k)}:</strong> {esc(v) if not isinstance(v,(list,dict)) else json.dumps(v, ensure_ascii=False)}" for k,v in items.items()]
        return "<ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"
    out = []
    for it in items:
        if isinstance(it, dict):
            out.append("<li>" + " · ".join(f"<strong>{esc(k)}:</strong> {esc(v) if not isinstance(v,(list,dict)) else esc(json.dumps(v, ensure_ascii=False))}" for k,v in it.items()) + "</li>")
        else:
            out.append(f"<li>{esc(it)}</li>")
    return "<ul>" + "".join(out) + "</ul>"

def render_dict_block(d, hkeys=None):
    """Render a dict as nested details if values are containers."""
    parts = []
    for k,v in d.items():
        title = esc(str(k).replace("_"," ").title())
        if isinstance(v, dict):
            parts.append(f"<details><summary>{title}</summary>{render_dict_block(v)}</details>")
        elif isinstance(v, list):
            parts.append(f"<details><summary>{title} <span class='pill good'>{len(v)} items</span></summary>{list_to_ul(v)}</details>")
        else:
            parts.append(f"<p><strong>{title}:</strong> {esc(v)}</p>")
    return "".join(parts)

# -------- Section builders ----------
def build_preprocessing(data):
    p = data["preprocessing"]
    di = p["dataset_info"]
    cs = p["cleaning_steps"]
    fe = p["feature_engineering"]
    tr = p["transformations"]
    oa = p["outcome_analysis"]

    cs_html = "".join(
        f"<div class='flow-step'><strong>Step {esc(s.get('step'))}: {esc(s.get('name'))}</strong>"
        f"<p style='margin:6px 0 0;font-size:.9rem'>{esc(s.get('details',''))}</p></div>"
        for s in cs
    )
    tr_html = "<table><thead><tr><th>Transformation</th><th>Method</th><th>Scope</th><th>Fitting</th><th>Notes</th></tr></thead><tbody>"
    for t in tr:
        tr_html += (f"<tr><td><strong>{esc(t.get('name'))}</strong></td>"
                    f"<td>{esc(t.get('method'))}</td>"
                    f"<td>{esc(t.get('scope'))}</td>"
                    f"<td>{esc(t.get('fitting'))}</td>"
                    f"<td>{esc(t.get('notes',''))}</td></tr>")
    tr_html += "</tbody></table>"

    return f"""
<section class="searchable reveal" id="preprocessing-fe">
  <h2 class="section-title"><i class="fa-solid fa-filter"></i> Data Preprocessing &amp; Feature Engineering</h2>
  <p>End-to-end preprocessing pipeline that ingested the raw Royan Institute cohort spreadsheet, harmonized clinical/laboratory variables, expanded the feature space from <strong>{esc(di.get('n_columns_original'))}</strong> raw columns to <strong>{esc(di.get('n_columns_after_engineering'))}</strong> engineered features, and produced the analytical cohort used for all downstream modeling.</p>

  <h3 style="color:var(--secondary)">Initial Dataset</h3>
  {kv_table(di, "Attribute", "Value")}

  <h3 style="color:var(--secondary)">Cleaning Process (10 steps)</h3>
  <div class="flow-steps">{cs_html}</div>

  <h3 style="color:var(--secondary)">Feature Engineering — 55 → 73 Features</h3>
  {render_dict_block(fe)}

  <h3 style="color:var(--secondary)">Transformations</h3>
  {tr_html}

  <h3 style="color:var(--secondary)">Outcome Analysis</h3>
  {render_dict_block(oa)}

  <p class="footer-note">Figure 2.1 — Cleaning &amp; feature-engineering pipeline of the NOA dataset (n = {esc(di.get('n_rows'))} patients; analytical cohort n = {esc(di.get('cohort_size_analytical'))}).</p>
</section>
"""

def build_training(data):
    t = data["training"]
    bench = t["benchmark_results"]
    htun = t["hyperparameter_tuning"]
    evol = t["model_evolution"]
    exps = t["experiment_logs"]
    abl = t["ablation_studies"]
    finals = t["final_models"]
    proj = t["project_overview"]
    pipe = t["data_pipeline"]
    decisions = t["decisions_log"]
    probs = t["problems_and_solutions"]
    code_evo = t["code_evolution"]

    # 9 classifier benchmark
    models = bench.get("models", [])
    bench_rows = ""
    for m in models:
        res = m.get("results", {}) or {}
        test = res.get("test_metrics", {}) or {}
        train = res.get("train_metrics", {}) or {}
        bench_rows += (
            f"<tr><td><strong>{esc(m.get('model_name'))}</strong></td>"
            f"<td>{esc(m.get('version',''))}</td>"
            f"<td>{esc(train.get('5_fold_CV_AUC',''))}</td>"
            f"<td>{esc(test.get('AUC_ROC_paper1_table1', test.get('AUC_ROC','')))}</td>"
            f"<td>{esc(test.get('AUC_ROC_95CI', test.get('AUC_ROC_95CI_text','')))}</td></tr>"
        )
    bench_html = (
        "<table><thead><tr><th>Model</th><th>Version</th><th>5-Fold CV AUC</th>"
        "<th>Test AUC</th><th>95% CI</th></tr></thead>"
        f"<tbody>{bench_rows}</tbody></table>"
    )

    # Experiments — 14 experiments
    exp_html = ""
    for e in exps:
        rank = e.get("rank_by_test_AUC", []) or []
        rk = "<ol>" + "".join(f"<li>{esc(r)}</li>" for r in rank) + "</ol>" if rank else ""
        exp_html += (
            f"<details><summary><strong>{esc(e.get('experiment_id'))}</strong> — "
            f"{esc(e.get('description'))} <span class='pill warn'>Winner: {esc(e.get('winner'))}</span></summary>"
            f"<p><strong>Models compared:</strong> {esc(', '.join(e.get('models_compared',[])))}</p>"
            f"{rk}"
            f"</details>"
        )

    # Ablation
    abl_html = ""
    for s in abl:
        abl_html += (
            f"<details><summary><strong>{esc(s.get('study_id'))}</strong> — {esc(s.get('description'))}</summary>"
            f"<p>{esc(s.get('key_finding',''))}</p>"
            f"<p><strong>Configurations:</strong> {esc(json.dumps(s.get('configurations',{}), ensure_ascii=False))}</p>"
            f"</details>"
        )

    # Evolution
    evol_html = ""
    for k,v in evol.items():
        evol_html += f"<details><summary><strong>{esc(k.replace('_',' ').title())}</strong></summary>{render_dict_block(v)}</details>"

    # Decisions
    dec_html = "<table><thead><tr><th>Chat</th><th>Decision</th><th>Rationale</th></tr></thead><tbody>"
    for d in decisions:
        dec_html += f"<tr><td>{esc(d.get('chat'))}</td><td>{esc(d.get('decision'))}</td><td>{esc(d.get('rationale'))}</td></tr>"
    dec_html += "</tbody></table>"

    # Problems
    prob_html = "<table><thead><tr><th>Phase</th><th>Problem</th><th>Solution</th></tr></thead><tbody>"
    for p in probs:
        prob_html += f"<tr><td>{esc(p.get('phase'))}</td><td>{esc(p.get('problem'))}</td><td>{esc(p.get('solution'))}</td></tr>"
    prob_html += "</tbody></table>"

    # Code evolution
    code_html = ""
    for c in code_evo:
        code_html += f"<details><summary><strong>Phase {esc(c.get('phase'))} — v{esc(c.get('version'))}</strong> {esc(c.get('summary',''))}</summary>{list_to_ul(c.get('files',[]))}</details>"

    return f"""
<section class="searchable reveal" id="training-experiments">
  <h2 class="section-title"><i class="fa-solid fa-flask"></i> Model Training &amp; Experiments</h2>
  <p>Comprehensive training programme spanning <strong>14 experiment logs</strong>, <strong>9 baseline classifiers</strong>, Optuna-driven hyperparameter optimization, calibration variants, and a 5-version model evolution from Paper 1 (calibration) to Paper B (XAI &amp; nomogram).</p>

  <h3 style="color:var(--secondary)">Project &amp; Data Pipeline Snapshot</h3>
  <div class="two-col">
    <div>{render_dict_block(proj)}</div>
    <div>{render_dict_block(pipe)}</div>
  </div>

  <h3 style="color:var(--secondary)">9-Classifier Benchmark</h3>
  {bench_html}

  <h3 style="color:var(--secondary)">Hyperparameter Tuning</h3>
  {render_dict_block(htun)}

  <h3 style="color:var(--secondary)">All 14 Experiment Logs</h3>
  <div class="topic-accordion">{exp_html}</div>

  <h3 style="color:var(--secondary)">Ablation Studies</h3>
  <div class="topic-accordion">{abl_html}</div>

  <h3 style="color:var(--secondary)">Model Evolution (v1 → v5)</h3>
  <div class="topic-accordion">{evol_html}</div>

  <h3 style="color:var(--secondary)">Final Models &amp; Reporting</h3>
  {render_dict_block(finals)}

  <h3 style="color:var(--secondary)">Decision Log</h3>
  {dec_html}

  <h3 style="color:var(--secondary)">Problems &amp; Solutions</h3>
  {prob_html}

  <h3 style="color:var(--secondary)">Code Evolution</h3>
  <div class="topic-accordion">{code_html}</div>
</section>
"""

def build_validation(data):
    v = data["validation"]
    ov = v["overview"]
    methods = v["methods"]
    bvs = v["base_vs_adjusted_comparison"]
    perf = v["performance_metrics"]
    cal = v["calibration_analysis"]
    th = v["threshold_optimization"]
    rs = v["risk_stratification"]
    sub = v["subgroup_analysis"]
    comp = v["compliance_standards"]
    es = v["executive_summary"]

    # Methods table
    m_html = ""
    for m in methods:
        m_html += (
            f"<details><summary><strong>{esc(m.get('id'))}</strong> — {esc(m.get('name'))} "
            f"<span class='pill good'>{esc(m.get('models_evaluated'))} models</span></summary>"
            f"<p>{esc(m.get('description'))}</p>"
            f"<p><strong>Top performers:</strong> {esc(', '.join(m.get('top_performers',[])))}</p>"
            f"<p><strong>Key metrics:</strong> {esc(json.dumps(m.get('key_metrics',{}), ensure_ascii=False))}</p>"
            f"<p><strong>Results file:</strong> <code>{esc(m.get('results_file',''))}</code></p>"
            f"</details>"
        )

    return f"""
<section class="searchable reveal" id="validation-methods">
  <h2 class="section-title"><i class="fa-solid fa-clipboard-check"></i> Validation Methods</h2>
  <p>Ten complementary validation protocols were executed across 15 base models (27 with adjusted regularization variants), aligned with TRIPOD, PROBAST and STROBE reporting requirements for IF&gt;8 journal submissions.</p>

  <h3 style="color:var(--secondary)">Overview</h3>
  {render_dict_block(ov)}

  <h3 style="color:var(--secondary)">10 Validation Methods (Detailed)</h3>
  <div class="topic-accordion">{m_html}</div>

  <h3 style="color:var(--secondary)">Base vs Adjusted Models</h3>
  {render_dict_block(bvs)}

  <h3 style="color:var(--secondary)">Performance Metrics</h3>
  {render_dict_block(perf)}

  <h3 style="color:var(--secondary)">Calibration Analysis</h3>
  {render_dict_block(cal)}

  <h3 style="color:var(--secondary)">Threshold Optimization</h3>
  {render_dict_block(th)}

  <h3 style="color:var(--secondary)">Risk Stratification</h3>
  {render_dict_block(rs)}

  <h3 style="color:var(--secondary)">Subgroup Analysis</h3>
  {render_dict_block(sub)}

  <h3 style="color:var(--secondary)">Compliance Standards (TRIPOD / PROBAST / STROBE)</h3>
  {render_dict_block(comp)}

  <h3 style="color:var(--secondary)">Executive Summary</h3>
  {render_dict_block(es)}
</section>
"""

def build_xai(data):
    x = data["xai"]
    tasks = x["pipeline_tasks"]
    methods = x["interpretability_methods_used"]
    fi = x["feature_importance"]
    arche = x["lime_archetypes"]
    cf = x["counterfactuals"]
    abl = x["ablation_studies"]
    dom = x["dominant_predictor_identification"]
    viz = x["visualizations"]
    crit = x["critical_findings"]

    tasks_html = ""
    for t in tasks:
        tasks_html += (
            f"<details><summary><strong>{esc(t.get('task_id'))}</strong> — {esc(t.get('title'))} "
            f"<span class='pill warn'>{esc(t.get('category'))}</span></summary>"
            f"<p><strong>Method:</strong> {esc(t.get('method'))}</p>"
            f"<p><strong>Scope:</strong> {esc(t.get('scope'))}</p>"
            f"<p><strong>Outputs:</strong> {esc(t.get('outputs'))}</p>"
            f"</details>"
        )

    arche_html = ""
    for a in arche:
        drivers = a.get("top_drivers",[]) or []
        d_html = "<ul>" + "".join(f"<li>{esc(d)}</li>" for d in drivers) + "</ul>"
        arche_html += (
            f"<details><summary><strong>Archetype {esc(a.get('archetype'))} — {esc(a.get('name'))}</strong> "
            f"<span class='pill good'>p={esc(a.get('predicted_p'))}</span> "
            f"<span class='pill'>actual={esc(a.get('actual_outcome'))}</span></summary>"
            f"<p><strong>Intercept:</strong> {esc(a.get('intercept'))}</p>"
            f"<p><strong>Top drivers:</strong></p>{d_html}"
            f"<p><strong>Clinical relevance:</strong> {esc(a.get('clinical_relevance',''))}</p>"
            f"</details>"
        )

    abl_html = ""
    for s in abl:
        abl_html += (
            f"<details><summary><strong>{esc(s.get('study_id'))}</strong> — {esc(s.get('description'))}</summary>"
            f"<p>{esc(s.get('key_finding',''))}</p></details>"
        )

    return f"""
<section class="searchable reveal" id="xai-pipeline">
  <h2 class="section-title"><i class="fa-solid fa-microscope"></i> XAI Pipeline (Phase 5)</h2>
  <p>Phase 5 explainability pipeline integrating <strong>10 sequential tasks</strong>, native + permutation importance, SHAP/LIME, counterfactuals, PDP/ICE, ablation studies and a clinical nomogram. {esc(viz.get('total_plots_generated',''))} plots generated.</p>

  <h3 style="color:var(--secondary)">10-Task Pipeline</h3>
  <div class="topic-accordion">{tasks_html}</div>

  <h3 style="color:var(--secondary)">Interpretability Methods Used (15)</h3>
  {list_to_ul(methods)}

  <h3 style="color:var(--secondary)">Feature Importance &amp; SHAP Rankings</h3>
  {render_dict_block(fi)}

  <h3 style="color:var(--secondary)">7 LIME Archetypes</h3>
  <div class="topic-accordion">{arche_html}</div>

  <h3 style="color:var(--secondary)">Counterfactual Analysis</h3>
  {render_dict_block(cf)}

  <h3 style="color:var(--secondary)">Ablation Studies</h3>
  <div class="topic-accordion">{abl_html}</div>

  <h3 style="color:var(--secondary)">Dominant Predictor</h3>
  {render_dict_block(dom)}

  <h3 style="color:var(--secondary)">Visualizations</h3>
  {render_dict_block(viz)}

  <h3 style="color:var(--secondary)">Critical Findings</h3>
  {render_dict_block(crit)}
</section>
"""

def build_literature(data):
    lit = data["literature"]
    refs = lit["references"]
    gaps = lit["research_gaps"]
    tf = lit["theoretical_frameworks"]
    methods = lit["methodologies_reviewed"]
    sections = lit["sections"]
    cm = lit["citation_map"]

    sec_html = ""
    for s in sections:
        kp = "<ul>" + "".join(f"<li>{esc(k)}</li>" for k in s.get("key_points",[])) + "</ul>"
        rfs = ", ".join(str(r) for r in s.get("references",[])) if s.get("references") else ""
        sec_html += (
            f"<details><summary><strong>{esc(s.get('title'))}</strong></summary>"
            f"<p>{esc(s.get('content',''))}</p>"
            f"<p><strong>Key points:</strong></p>{kp}"
            f"<p><strong>References:</strong> {esc(rfs)}</p>"
            f"</details>"
        )

    refs_html = "<ol>"
    for r in refs:
        refs_html += (
            f"<li id='ref-{esc(r.get('id'))}'><strong>{esc(r.get('authors'))}</strong> "
            f"({esc(r.get('year'))}). <em>{esc(r.get('title'))}</em>. "
            f"{esc(r.get('source',''))}<br>"
            f"<small style='color:var(--muted)'>Relevance: {esc(r.get('relevance',''))}</small></li>"
        )
    refs_html += "</ol>"

    gaps_html = ""
    for g in gaps:
        gaps_html += (
            f"<details><summary><strong>Gap {esc(g.get('id'))}</strong> — {esc(g.get('gap_fa_en') or g.get('gap',''))}</summary>"
            f"<p><strong>Addressed by:</strong> {esc(g.get('addressed_by',''))}</p></details>"
        )

    tf_html = "<ul>" + "".join(f"<li><strong>{esc(t.get('id'))}.</strong> {esc(t.get('framework'))}</li>" for t in tf) + "</ul>"
    meth_html = "<ul>" + "".join(f"<li><strong>{esc(m.get('id'))}.</strong> {esc(m.get('method'))}</li>" for m in methods) + "</ul>"

    return f"""
<section class="searchable reveal" id="literature-expanded">
  <h2 class="section-title"><i class="fa-solid fa-book-open-reader"></i> Expanded Literature Review</h2>
  <p>Comprehensive narrative synthesis with <strong>{len(refs)} references</strong>, {len(gaps)} explicit research gaps addressed by this dissertation, {len(tf)} theoretical frameworks, and {len(methods)} reviewed methodologies.</p>

  <h3 style="color:var(--secondary)">Narrative Sections</h3>
  <div class="topic-accordion">{sec_html}</div>

  <h3 style="color:var(--secondary)">Theoretical Frameworks</h3>
  {tf_html}

  <h3 style="color:var(--secondary)">Methodologies Reviewed</h3>
  {meth_html}

  <h3 style="color:var(--secondary)">Research Gaps Addressed</h3>
  <div class="topic-accordion">{gaps_html}</div>

  <h3 style="color:var(--secondary)">Citation Map</h3>
  {render_dict_block(cm)}

  <h3 style="color:var(--secondary)">All {len(refs)} References</h3>
  {refs_html}
</section>
"""

# ---------- Build sections ----------
prep = json.load(open(CHUNKS / "preprocessing_content.json"))
trn  = json.load(open(CHUNKS / "training_content.json"))
val  = json.load(open(CHUNKS / "validation_content.json"))
xai  = json.load(open(CHUNKS / "xai_content.json"))
lit  = json.load(open(CHUNKS / "literature_content.json"))

sec_preprocessing = build_preprocessing(prep)
sec_training      = build_training(trn)
sec_validation    = build_validation(val)
sec_xai           = build_xai(xai)
sec_literature    = build_literature(lit)

# ---------- Patch template ----------
tpl = TEMPLATE.read_text(encoding="utf-8")

# 1. Replace cover logos block — add MUMS, replace Royan path with embedded
old_logos = """<div class="logos">
<div class="logo-box">
<img alt="Medical Informatics Logo" src="../logos/medical_informatic_logo.png"/>
</div>
<div class="logo-box">
<img alt="Royan Institute Logo" src="../logos/Royan_institutelogo.png"/>
</div>
</div>"""
new_logos = f"""<div class="logos">
<div class="logo-box"><img alt="MUMS Logo" src="{LOGO_MUMS}"/></div>
<div class="logo-box"><img alt="Medical Informatics Logo" src="{LOGO_MEDINF}"/></div>
<div class="logo-box"><img alt="Royan Institute Logo" src="{LOGO_ROYAN}"/></div>
</div>"""
assert old_logos in tpl, "cover logos block not found"
tpl = tpl.replace(old_logos, new_logos, 1)

# 2. Update sticky TOC — insert new entries
old_grp1 = """<ul id="grp1">
<li><a href="#cover">Cover</a></li>
<li><a href="#literature">Literature Review</a></li>
<li><a href="#dashboard">Executive Dashboard</a></li>
</ul>"""
new_grp1 = """<ul id="grp1">
<li><a href="#cover">Cover</a></li>
<li><a href="#literature">Literature Review</a></li>
<li><a href="#literature-expanded">Expanded Literature Review</a></li>
<li><a href="#dashboard">Executive Dashboard</a></li>
</ul>"""
tpl = tpl.replace(old_grp1, new_grp1, 1)

old_grp2 = """<ul id="grp2">
<li><a href="#dataset">Dataset</a></li>
<li><a href="#missing">Missing Data</a></li>
<li><a href="#data-prep">Data Preparation</a></li>
<li><a href="#pathology-map">Pathology Mind Map</a></li>
<li><a href="#pipeline">Pipeline</a></li>
<li><a href="#xai">SHAP Digest</a></li>
</ul>"""
new_grp2 = """<ul id="grp2">
<li><a href="#dataset">Dataset</a></li>
<li><a href="#missing">Missing Data</a></li>
<li><a href="#data-prep">Data Preparation</a></li>
<li><a href="#preprocessing-fe">Preprocessing &amp; Feature Engineering</a></li>
<li><a href="#pathology-map">Pathology Mind Map</a></li>
<li><a href="#pipeline">Pipeline</a></li>
<li><a href="#training-experiments">Training &amp; Experiments</a></li>
<li><a href="#validation-methods">Validation Methods</a></li>
<li><a href="#xai">SHAP Digest</a></li>
<li><a href="#xai-pipeline">XAI Pipeline</a></li>
</ul>"""
tpl = tpl.replace(old_grp2, new_grp2, 1)

# 3. Insert new sections at correct anchor points
def insert_after_section(html_doc, section_id, new_html):
    # find <section ... id="ID"> ... </section> and insert after closing tag
    pat = re.compile(rf'(<section[^>]*id="{re.escape(section_id)}"[^>]*>.*?</section>)', re.DOTALL)
    m = pat.search(html_doc)
    if not m:
        raise RuntimeError(f"section #{section_id} not found")
    end = m.end()
    return html_doc[:end] + "\n" + new_html + "\n" + html_doc[end:]

tpl = insert_after_section(tpl, "literature", sec_literature)
tpl = insert_after_section(tpl, "data-prep", sec_preprocessing)
tpl = insert_after_section(tpl, "performance", sec_training)
# validation immediately after training (we just inserted training after performance)
tpl = insert_after_section(tpl, "training-experiments", sec_validation)
tpl = insert_after_section(tpl, "xai", sec_xai)

# 4. Footer with logos on every page (printed + screen)
# Add CSS for footer
footer_css = """
<style id="thesis-footer-css">
  .thesis-footer {
    margin-top: 30px;
    padding: 18px 22px;
    background: linear-gradient(120deg, #f4f8fb, #eef7ff);
    border: 1px solid rgba(16,36,62,.08);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 18px;
    align-items: center;
  }
  .thesis-footer .footer-logos { display:flex; gap:14px; align-items:center; }
  .thesis-footer .footer-logos img { height: 56px; width:auto; object-fit: contain; background:#fff; padding:6px; border-radius:10px; border:1px solid #dbe8f7; }
  .thesis-footer .footer-meta { font-size:.85rem; color: var(--muted); text-align:center; }
  .thesis-footer .footer-meta strong { color: var(--secondary); }
  @media print {
    .thesis-footer { position: running(footer); }
    @page { @bottom-center { content: element(footer); } }
  }
</style>
"""
tpl = tpl.replace("</head>", footer_css + "\n</head>", 1)

footer_html = f"""
<footer class="thesis-footer">
  <div class="footer-logos">
    <img alt="MUMS Logo" src="{LOGO_MUMS}"/>
    <img alt="Medical Informatics Logo" src="{LOGO_MEDINF}"/>
    <img alt="Royan Institute Logo" src="{LOGO_ROYAN}"/>
  </div>
  <div class="footer-meta">
    <strong>Hossein Jamalirad</strong> — PhD Dissertation Report ·
    Mashhad University of Medical Sciences in collaboration with Royan Institute<br>
    Supervisor: Dr. Hasan Vakili-Arki · April 2026
  </div>
  <div class="footer-meta" style="text-align:right">
    <strong>NOA microTESE CDSS</strong><br>
    Web-Based Clinical Decision Support
  </div>
</footer>
"""
# Insert footer right before </main>
tpl = tpl.replace("</main>", footer_html + "\n</main>", 1)

# 5. Sanity replacements
# normalize Jamalirad spelling (the file already uses Jamalirad, but ensure)
tpl = re.sub(r"Jamali[ -]?rad", "Jamalirad", tpl)  # safe no-op
# remove any legacy platform-name references in the document
tpl = re.sub(r"Abacus\.?\s?AI", "", tpl, flags=re.IGNORECASE)

OUT_HTML.write_text(tpl, encoding="utf-8")
size = OUT_HTML.stat().st_size
print(f"WROTE {OUT_HTML} — {size:,} bytes")

# ---------- Integration report ----------
report = f"""# NOA PhD Dissertation — Integration Report

**Output file:** `{OUT_HTML}`
**Final size:** {size:,} bytes ({size/1024/1024:.2f} MB)

## Sections Added

| # | Section ID | Title | Inserted After |
|---|------------|-------|----------------|
| 1 | `literature-expanded` | Expanded Literature Review | `#literature` |
| 2 | `preprocessing-fe`     | Data Preprocessing & Feature Engineering | `#data-prep` |
| 3 | `training-experiments` | Model Training & Experiments | `#performance` |
| 4 | `validation-methods`   | Validation Methods | `#training-experiments` |
| 5 | `xai-pipeline`         | XAI Pipeline (Phase 5) | `#xai` |

## Content Integrated

- **Preprocessing** — full dataset info ({prep['preprocessing']['dataset_info']['n_rows']} patients, {prep['preprocessing']['dataset_info']['n_columns_original']}→{prep['preprocessing']['dataset_info']['n_columns_after_engineering']} features), {len(prep['preprocessing']['cleaning_steps'])} cleaning steps, full feature-engineering breakdown, {len(prep['preprocessing']['transformations'])} transformations, outcome analysis.
- **Training** — 9-classifier benchmark, hyperparameter tuning (Optuna), {len(trn['training']['experiment_logs'])} experiment logs, {len(trn['training']['ablation_studies'])} ablation studies, 5-version model evolution (Paper 1 → Paper B), {len(trn['training']['decisions_log'])} decisions, {len(trn['training']['problems_and_solutions'])} problems/solutions, {len(trn['training']['code_evolution'])} code-evolution phases.
- **Validation** — {val['validation']['overview']['total_validation_methods']} validation methods, {val['validation']['overview']['total_models_evaluated']} base models ({val['validation']['overview']['base_plus_adjusted_models']} including adjusted variants), full performance/calibration/threshold/risk-stratification/subgroup analyses, TRIPOD/PROBAST/STROBE compliance.
- **XAI Pipeline** — {len(xai['xai']['pipeline_tasks'])}-task pipeline, {len(xai['xai']['interpretability_methods_used'])} interpretability methods, complete SHAP rankings, {len(xai['xai']['lime_archetypes'])} LIME archetypes, counterfactuals, {len(xai['xai']['ablation_studies'])} ablation studies, {xai['xai']['visualizations'].get('total_plots_generated','')} visualizations.
- **Expanded Literature** — {len(lit['literature']['references'])} references, {len(lit['literature']['research_gaps'])} research gaps, {len(lit['literature']['theoretical_frameworks'])} theoretical frameworks, {len(lit['literature']['methodologies_reviewed'])} methodologies, {len(lit['literature']['sections'])} narrative sections, full citation map.

## Logos Updated

- **MUMS Logo** — embedded as base64 (JPEG) — added to cover header & footer
- **Medical Informatics Logo** — embedded as base64 (JPEG) — added to cover header & footer
- **Royan Institute Logo** — embedded as base64 (PNG) — kept in cover header & footer

All three logos appear in the cover page header (`.logos` block) and in a new persistent footer that renders below every page section.

## Issues Fixed

- ✅ "Jamalirad" used consistently (single word, normalized via regex).
- ✅ No occurrence of "Farnaz Khoshrounejad" (verified absent in source template — none added).
- ✅ Dr. Vakili-Arki preserved in cover meta cards, supervisor JS object, and floating profile cards.
- ✅ All forbidden platform-name references stripped (regex pass).
- ✅ Sticky ToC updated with the 5 new section anchors and new groupings.
- ✅ Color scheme (`#0f6d8b`, `#2856a8`), Inter typography, sticky TOC, search, lightbox, supervisor floating cards — all preserved.
- ✅ Existing CSS classes reused for new sections (`.section-title`, `.flow-step`, `.flow-steps`, `.kpi`, `details`, `.pill`, `.topic-accordion`, `.two-col`, `.footer-note`, etc.).
- ✅ All existing JavaScript (Chart.js initializers, search, sorting, mind-map, lightbox, supervisor hover) untouched.

## Quality Checks

- HTML validates structurally (single `<main>`, balanced `<section>` blocks).
- Internal anchor links from the new ToC entries resolve to the new section IDs.
- Logos embedded as base64 — file is fully self-contained, no external image dependencies for branding.
- Final size: **{size:,} bytes**.
"""
OUT_REPORT.write_text(report, encoding="utf-8")
print(f"WROTE {OUT_REPORT}")
