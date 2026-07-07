"""
SHARPpy reference value generator for wizard-soundings tests.
=============================================================

Outputs a JSON file (sharppy_reference.json) with derived parameters
from SHARPpy for the 14061619.OAX sounding. This JSON is consumed by
default.test.js to validate wizard-soundings calculations.

Usage:
    conda activate intel
    python sharppy.initVals.py
"""

import warnings
warnings.filterwarnings("ignore")

import json
import os
import numpy as np
from datetime import datetime
from sharppy.sharptab import winds, utils, params, thermo, interp, profile
from sharppy.io.spc_decoder import SPCDecoder


def safe_float(val):
    """Convert numpy/masked values to plain float or None."""
    if val is None:
        return None
    try:
        v = float(val)
        if np.isnan(v) or np.isinf(v):
            return None
        return round(v, 4)
    except (TypeError, ValueError):
        return None


def decode(filename):
    dec = SPCDecoder(filename)
    if dec is None:
        raise IOError("Could not figure out the format of '%s'!" % filename)

    profs = dec.getProfiles()
    stn_id = dec.getStnId()

    for k in list(profs._profs.keys()):
        all_prof = profs._profs[k]
        dates = profs._dates
        for i in range(len(all_prof)):
            prof = all_prof[i]
            new_prof = profile.create_profile(
                pres=prof.pres, hght=prof.hght, tmpc=prof.tmpc,
                dwpc=prof.dwpc, wspd=prof.wspd, wdir=prof.wdir,
                strictQC=False, profile='convective', date=dates[i]
            )
            return new_prof, dates[i], stn_id


# ============================================================
# Load profile
# ============================================================
FILENAME = os.path.join(os.path.dirname(__file__), 'data', '14061619.OAX')
prof, time, location = decode(FILENAME)

# ============================================================
# Pressure levels
# ============================================================
sfc = prof.pres[prof.sfc]
p1km = interp.pres(prof, interp.to_msl(prof, 1000.))
p3km = interp.pres(prof, interp.to_msl(prof, 3000.))
p4km = interp.pres(prof, interp.to_msl(prof, 4000.))
p6km = interp.pres(prof, interp.to_msl(prof, 6000.))
p8km = interp.pres(prof, interp.to_msl(prof, 8000.))

# ============================================================
# Parcel calculations
# ============================================================
sfcpcl = prof.sfcpcl
mlpcl = prof.mlpcl
mupcl = prof.mupcl

# ============================================================
# Storm motion (Bunkers)
# ============================================================
srwind = params.bunkers_storm_motion(prof)
rstu = srwind[0]
rstv = srwind[1]
lstu = srwind[2]
lstv = srwind[3]

# ============================================================
# Shear calculations
# ============================================================
sfc_1km_shear = winds.wind_shear(prof, pbot=sfc, ptop=p1km)
sfc_3km_shear = winds.wind_shear(prof, pbot=sfc, ptop=p3km)
sfc_6km_shear = winds.wind_shear(prof, pbot=sfc, ptop=p6km)
sfc_8km_shear = winds.wind_shear(prof, pbot=sfc, ptop=p8km)

sfc1kmshr = utils.comp2vec(sfc_1km_shear[0], sfc_1km_shear[1])[1]
sfc3kmshr = utils.comp2vec(sfc_3km_shear[0], sfc_3km_shear[1])[1]
sfc6kmshr = utils.comp2vec(sfc_6km_shear[0], sfc_6km_shear[1])[1]
sfc8kmshr = utils.comp2vec(sfc_8km_shear[0], sfc_8km_shear[1])[1]

# ============================================================
# Storm-relative helicity
# ============================================================
srh1km = winds.helicity(prof, 0, 1000., stu=rstu, stv=rstv)
srh3km = winds.helicity(prof, 0, 3000., stu=rstu, stv=rstv)
srh6km = winds.helicity(prof, 0, 6000., stu=rstu, stv=rstv)
srh8km = winds.helicity(prof, 0, 8000., stu=rstu, stv=rstv)

# Effective SRH
right_esrh = prof.right_esrh[0]

# ============================================================
# Effective inflow layer
# ============================================================
eff_inflow = params.effective_inflow_layer(prof)
effp0 = eff_inflow[0]  # bottom pressure
effp1 = eff_inflow[1]  # top pressure

# Effective shear
eff_shear = winds.wind_shear(prof, pbot=effp0, ptop=effp1)
effshr = utils.comp2vec(eff_shear[0], eff_shear[1])[1]

# Effective BWD
ebwdshr = prof.ebwspd

# ============================================================
# Mean winds (u,v components)
# ============================================================
mw1 = winds.mean_wind(prof, pbot=sfc, ptop=p1km)
mw3 = winds.mean_wind(prof, pbot=sfc, ptop=p3km)
mw6 = winds.mean_wind(prof, pbot=sfc, ptop=p6km)
mw8 = winds.mean_wind(prof, pbot=sfc, ptop=p8km)
eff_mw = winds.mean_wind(prof, pbot=effp0, ptop=effp1)

# ============================================================
# Storm-relative winds (u,v components)
# ============================================================
srw1 = winds.sr_wind(prof, pbot=sfc, ptop=p1km, stu=rstu, stv=rstv)
srw3 = winds.sr_wind(prof, pbot=sfc, ptop=p3km, stu=rstu, stv=rstv)
srw6 = winds.sr_wind(prof, pbot=sfc, ptop=p6km, stu=rstu, stv=rstv)
srw8 = winds.sr_wind(prof, pbot=sfc, ptop=p8km, stu=rstu, stv=rstv)
srw46 = winds.sr_wind(prof, pbot=p4km, ptop=p6km, stu=rstu, stv=rstv)
srw_eff = winds.sr_wind(prof, pbot=effp0, ptop=effp1, stu=rstu, stv=rstv)

# ============================================================
# Composite parameters
# ============================================================
scp = params.scp(mupcl.bplus, prof.right_esrh[0], prof.ebwspd)
stp_cin = params.stp_cin(mlpcl.bplus, prof.right_esrh[0], prof.ebwspd, mlpcl.lclhght, mlpcl.bminus)
stp_fixed = params.stp_fixed(sfcpcl.bplus, sfcpcl.lclhght, srh1km[0],
                              utils.comp2vec(prof.sfc_6km_shear[0], prof.sfc_6km_shear[1])[1])
ship = params.ship(prof)

# ============================================================
# Thermodynamic indices
# ============================================================
dcape_val = params.dcape(prof)
k_index = params.k_index(prof)
t_totals = params.t_totals(prof)
mean_thetae = params.mean_thetae(prof, 1000, 500)

# Precipitable water (inches)
pw = prof.pwat

# Theta-e index
tei = prof.tei

# ============================================================
# Mean relative humidity
# ============================================================
low_rh = params.mean_relh(prof, pbot=sfc, ptop=sfc - 100)
mid_rh = params.mean_relh(prof, pbot=sfc - 150, ptop=sfc - 350)

# ============================================================
# BRN Shear
# ============================================================
brn_pcl = params.bulk_rich(prof, mupcl)
brn_shear = brn_pcl.brnshear

# ============================================================
# Corfidi vectors
# ============================================================
corfidi = winds.corfidi_mcs_motion(prof)
# Returns (upshear_u, upshear_v, downshear_u, downshear_v)
upshear = (corfidi[0], corfidi[1])
downshear = (corfidi[2], corfidi[3])

# ============================================================
# Convective temperature
# ============================================================
try:
    conv_temp = params.convective_temp(prof)
except:
    conv_temp = None

# ============================================================
# Maximum temperature
# ============================================================
try:
    max_temp = params.max_temp(prof)
except:
    max_temp = None

# ============================================================
# Mean mixing ratio (g/kg)
# ============================================================
mean_mixr = params.mean_mixratio(prof)

# ============================================================
# LCL-EL layer calculations
# ============================================================
plcl = interp.pres(prof, interp.to_msl(prof, mupcl.lclhght))
pel = interp.pres(prof, interp.to_msl(prof, mupcl.elhght))

try:
    ellcl_shear = winds.wind_shear(prof, pbot=plcl, ptop=pel)
    ellclshr = utils.comp2vec(ellcl_shear[0], ellcl_shear[1])[1]
    ellcl_mw = winds.mean_wind(prof, pbot=plcl, ptop=pel)
    srw_ellcl = winds.sr_wind(prof, pbot=plcl, ptop=pel, stu=rstu, stv=rstv)
    srh_lclel = winds.helicity(prof, mupcl.lclhght, mupcl.elhght, stu=rstu, stv=rstv)
except:
    ellclshr = None
    ellcl_mw = (None, None)
    srw_ellcl = (None, None)
    srh_lclel = (None,)

# ============================================================
# Build output dictionary
# ============================================================
output = {
    # --- Surface parcel ---
    "sfcCAPE": safe_float(sfcpcl.bplus),
    "sfcCINH": safe_float(sfcpcl.bminus),
    "sfcLCL": safe_float(sfcpcl.lclhght),
    "sfcLFC": safe_float(sfcpcl.lfchght),
    "sfcEL": safe_float(sfcpcl.elhght),
    "sfcLI": safe_float(sfcpcl.li5),

    # --- Mixed-layer parcel ---
    "mlCAPE": safe_float(mlpcl.bplus),
    "mlCINH": safe_float(mlpcl.bminus),
    "mlLCL": safe_float(mlpcl.lclhght),
    "mlLFC": safe_float(mlpcl.lfchght),
    "mlEL": safe_float(mlpcl.elhght),
    "mlLI": safe_float(mlpcl.li5),

    # --- Most-unstable parcel ---
    "muCAPE": safe_float(mupcl.bplus),
    "muCINH": safe_float(mupcl.bminus),
    "muLCL": safe_float(mupcl.lclhght),
    "muLFC": safe_float(mupcl.lfchght),
    "muEL": safe_float(mupcl.elhght),
    "muLI": safe_float(mupcl.li5),

    # --- Thermodynamic indices ---
    "pw": safe_float(pw),
    "tei": safe_float(tei),
    "dcape": safe_float(dcape_val[0]),
    "kIndex": safe_float(k_index),
    "tTotals": safe_float(t_totals),
    "meanMR": safe_float(mean_mixr),
    "cTemp": safe_float(conv_temp),
    "maxT": safe_float(max_temp),
    "meanThetaE": safe_float(mean_thetae),

    # --- Shear magnitudes (kts) ---
    "sfc1kmshr": safe_float(sfc1kmshr),
    "sfc3kmshr": safe_float(sfc3kmshr),
    "sfc6kmshr": safe_float(sfc6kmshr),
    "sfc8kmshr": safe_float(sfc8kmshr),
    "effshr": safe_float(effshr),
    "ebwdshr": safe_float(ebwdshr),
    "ellclshr": safe_float(ellclshr),

    # --- Storm-relative helicity (m2/s2) ---
    "right_srh1km": safe_float(srh1km[0]),
    "right_srh3km": safe_float(srh3km[0]),
    "right_srh6km": safe_float(srh6km[0]),
    "right_srh8km": safe_float(srh8km[0]),
    "right_srheff": safe_float(right_esrh),
    "right_srhlclel": safe_float(srh_lclel[0]),

    # --- Bunkers storm motion (u, v in kts) ---
    "rstVector": {"u": safe_float(rstu), "v": safe_float(rstv)},
    "lstVector": {"u": safe_float(lstu), "v": safe_float(lstv)},

    # --- Mean winds (u, v in kts) ---
    "mw1Vector": {"u": safe_float(mw1[0]), "v": safe_float(mw1[1])},
    "mw3Vector": {"u": safe_float(mw3[0]), "v": safe_float(mw3[1])},
    "mw6Vector": {"u": safe_float(mw6[0]), "v": safe_float(mw6[1])},
    "mw8Vector": {"u": safe_float(mw8[0]), "v": safe_float(mw8[1])},
    "effwVector": {"u": safe_float(eff_mw[0]), "v": safe_float(eff_mw[1])},
    "ellclwVector": {"u": safe_float(ellcl_mw[0]), "v": safe_float(ellcl_mw[1])},

    # --- Storm-relative winds (u, v in kts) ---
    "srw1Vector": {"u": safe_float(srw1[0]), "v": safe_float(srw1[1])},
    "srw3Vector": {"u": safe_float(srw3[0]), "v": safe_float(srw3[1])},
    "srw6Vector": {"u": safe_float(srw6[0]), "v": safe_float(srw6[1])},
    "srw8Vector": {"u": safe_float(srw8[0]), "v": safe_float(srw8[1])},
    "srw46Vector": {"u": safe_float(srw46[0]), "v": safe_float(srw46[1])},
    "srweffVector": {"u": safe_float(srw_eff[0]), "v": safe_float(srw_eff[1])},
    "srwellclVector": {"u": safe_float(srw_ellcl[0]), "v": safe_float(srw_ellcl[1])},

    # --- Corfidi vectors (u, v in kts) ---
    "upVector": {"u": safe_float(upshear[0]), "v": safe_float(upshear[1])},
    "dnVector": {"u": safe_float(downshear[0]), "v": safe_float(downshear[1])},

    # --- Relative humidity (%) ---
    "lowRH": safe_float(low_rh),
    "midRH": safe_float(mid_rh),

    # --- BRN Shear ---
    "brnShear": safe_float(brn_shear),

    # --- Composite parameters ---
    "scp": safe_float(scp),
    "stp_cin": safe_float(stp_cin),
    "stp_fixed": safe_float(stp_fixed),
    "ship": safe_float(ship),

    # --- Pressure levels (for reference) ---
    "sfcPres": safe_float(sfc),
    "p1km": safe_float(p1km),
    "p3km": safe_float(p3km),
    "p6km": safe_float(p6km),
    "p8km": safe_float(p8km),
}

# ============================================================
# Write JSON
# ============================================================
out_path = os.path.join(os.path.dirname(__file__), 'data', 'sharppy_reference.json')
with open(out_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f"SHARPpy reference values written to: {out_path}")
print(f"Total parameters: {len(output)}")
print()
for key, val in output.items():
    print(f"  {key}: {val}")

