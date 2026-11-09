# Builds the styled relief raster + elevation grid from Terrarium tiles.
import json, math, sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
D=sys.argv[1]; OUT=sys.argv[2]
Z,x0,x1,y0,y1=map(int,open(f'{D}/bbox.txt').read().split())
W=(x1-x0+1)*256; H=(y1-y0+1)*256
elev=np.zeros((H,W),np.float32)
for x in range(x0,x1+1):
    for y in range(y0,y1+1):
        a=np.asarray(Image.open(f'{D}/tiles/{Z}_{x}_{y}.png').convert('RGB')).astype(np.float32)
        elev[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=a[...,0]*256+a[...,1]+a[...,2]/256-32768
elev=np.maximum(elev,150)
def proj(lon,lat):
    px=(lon+180)/360*2**Z*256 - x0*256
    r=math.radians(lat); py=(1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**Z*256 - y0*256
    return px,py
def blur(a,sig):
    r=int(sig*3)+1; k=np.exp(-np.arange(-r,r+1)**2/(2*sig*sig)); k/=k.sum()
    a=np.pad(a,r,mode='edge')
    a=np.apply_along_axis(lambda v:np.convolve(v,k,'valid'),1,a) if False else sum(k[i]*a[:,i:i+a.shape[1]-2*r] for i in range(2*r+1))
    a=sum(k[i]*a[i:i+a.shape[0]-2*r,:] for i in range(2*r+1))
    return a.astype(np.float32)
# masks
def poly_mask(geoms, holes=True):
    m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m)
    for g in geoms:
        polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
        for p in polys:
            d.polygon([proj(*c) for c in p[0]],fill=255)
            if holes:
                for h in p[1:]: d.polygon([proj(*c) for c in h],fill=0)
    return m
ch=json.load(open(f'{D}/ch_border.json'))['feature']['geometry']
chm=poly_mask([ch])
lakes=json.load(open(f'{D}/lakes.json'))
lkm=poly_mask([f['geometry'] for f in lakes['features']])
CH=np.asarray(chm.filter(ImageFilter.GaussianBlur(2)),np.float32)/255
LK=np.asarray(lkm.filter(ImageFilter.GaussianBlur(0.8)),np.float32)/255
# hillshade (multi-directional), cell ~ 104 m at z10/46.8N
cell=156543.03392*math.cos(math.radians(46.8))/2**Z
e=blur(elev,0.7)
gy,gx=np.gradient(e*1.7,cell)
slope=np.arctan(np.hypot(gx,gy)); aspect=np.arctan2(-gx,gy)
def hs(az,alt):
    az=math.radians(az); alt=math.radians(alt)
    return np.clip(np.sin(alt)*np.cos(slope)+np.cos(alt)*np.sin(slope)*np.cos(az-aspect-math.pi/2),0,1)
shade=0.55*hs(315,40)+0.25*hs(270,50)+0.20*hs(0,55)
# hypsometric ramp in Carte Nationale colours
stops=[(150,'#0B2733'),(420,'#0E3040'),(800,'#123C4D'),(1300,'#17566A'),(1900,'#1F7A8C'),(2500,'#5E9FA6'),(3000,'#8FC1C4'),(3500,'#C4DCDB'),(4200,'#EEF3F2')]
hx=lambda h:[int(h[i:i+2],16)/255 for i in (1,3,5)]
xs=np.array([s[0] for s in stops],np.float32); cols=np.array([hx(s[1]) for s in stops],np.float32)
rgb=np.stack([np.interp(elev,xs,cols[:,i]) for i in range(3)],-1)
lum=(0.35+0.95*shade)[...,None]
inside=rgb*lum
# outside: dim + pull toward Night
night=np.array(hx('#0B2733'),np.float32)
outside=night*0.85 + (rgb*lum-night)*0.28
mix=CH[...,None]
img=outside*(1-mix)+inside*mix
# lakes: deep night water with faint sheen
water_in=np.array(hx('#081F29'),np.float32); water_out=np.array(hx('#0A2430'),np.float32)
water=water_out*(1-mix)+water_in*mix
img=img*(1-LK[...,None])+water*LK[...,None]
img=np.clip(img,0,1)
Image.fromarray((img*255).astype(np.uint8)).save(f'{OUT}/relief.jpg',quality=93)
# small preview
Image.fromarray((img*255).astype(np.uint8)).resize((W//4,H//4),Image.LANCZOS).save(f'{OUT}/../data/relief_preview.png')
# elevation grid for contours, half resolution, cropped to CH bbox + margin
bx0,by1=proj(5.85,45.72); bx1,by0=proj(10.62,47.9)
bx0,by0,bx1,by1=[int(v) for v in (bx0,by0,bx1,by1)]
sub=elev[by0:by1,bx0:bx1]
f=2
sh=sub[:sub.shape[0]//f*f,:sub.shape[1]//f*f].reshape(sub.shape[0]//f,f,sub.shape[1]//f,f).mean((1,3))
sh=blur(sh.astype(np.float32),1.2)
json.dump({'w':int(sh.shape[1]),'h':int(sh.shape[0]),'f':f,'ox':bx0,'oy':by0,'values':[round(float(v),1) for v in sh.ravel()]},open(f'{OUT}/../data/grid.json','w'))
np.save(f'{OUT}/../data/elev.npy',elev)
json.dump({'z':Z,'x0':x0,'y0':y0,'W':W,'H':H},open(f'{OUT}/../data/meta.json','w'))
print('mosaic',W,H,'elev range',float(elev.min()),float(elev.max()),'grid',sh.shape)
