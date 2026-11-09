import math, os, sys, urllib.request, concurrent.futures as cf
Z=10
def tx(lon): return (lon+180)/360*2**Z
def ty(lat):
    r=math.radians(lat); return (1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**Z
LON0,LON1,LAT0,LAT1=5.0,11.6,45.45,48.15
x0,x1=int(tx(LON0)),int(tx(LON1)); y0,y1=int(ty(LAT1)),int(ty(LAT0))
print('x',x0,x1,'y',y0,y1,(x1-x0+1)*(y1-y0+1),'tiles')
out=sys.argv[1]
def get(xy):
    x,y=xy; p=f'{out}/{Z}_{x}_{y}.png'
    if os.path.exists(p): return
    for i in range(4):
        try:
            urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png',p); return
        except Exception as e: err=e
    print('fail',xy,err)
with cf.ThreadPoolExecutor(16) as ex: list(ex.map(get,[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]))
open(f'{out}/../bbox.txt','w').write(f'{Z} {x0} {x1} {y0} {y1}\n')
