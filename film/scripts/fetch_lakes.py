import json, urllib.request, sys
out=sys.argv[1]
base='https://api3.geo.admin.ch/rest/services/api/MapServer'
ids={}
for off in range(0,2000,200):
    u=f'{base}/identify?geometryType=esriGeometryEnvelope&geometry=5.9,45.8,10.6,47.9&imageDisplay=1000,1000,96&mapExtent=5.9,45.8,10.6,47.9&tolerance=0&layers=all:ch.bafu.vec25-seen&sr=4326&returnGeometry=false&limit=200&offset={off}'
    r=json.load(urllib.request.urlopen(u,timeout=60))['results']
    for f in r: ids[f['id']]=f.get('properties') or f.get('attributes')
    if len(r)<200: break
print(len(ids),'lakes total')
big=[(i,p) for i,p in ids.items() if (p.get('seeflaeche_km2') or 0)>=1.0]
print(len(big),'>=1km2')
feats=[]
for i,p in big:
    u=f'{base}/ch.bafu.vec25-seen/{i}?geometryFormat=geojson&sr=4326'
    f=json.load(urllib.request.urlopen(u,timeout=60))['feature']
    feats.append({'type':'Feature','properties':{'name':p['name'],'km2':p['seeflaeche_km2']},'geometry':f['geometry']})
json.dump({'type':'FeatureCollection','features':feats},open(out,'w'))
print(sorted([(round(p['seeflaeche_km2'],1),p['name']) for i,p in big],reverse=True)[:25])
