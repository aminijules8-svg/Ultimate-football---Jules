# Minimal reader for binary FBX files, including the old FBX 6.1 layout (version 6100) that Blender's importer
# refuses. Mixamo's pack downloads use it. parse(path) -> (version, [Node]); Node = (name, props, children).
import struct, zlib

def _arr(data, o, code):
    n, enc, clen = struct.unpack_from('<III', data, o); o += 12
    raw = data[o:o + clen]; o += clen
    if enc == 1:
        raw = zlib.decompress(raw)
    fmt = {'f': 'f', 'd': 'd', 'l': 'q', 'i': 'i', 'b': 'b'}[code]
    return list(struct.unpack('<%d%s' % (n, fmt), raw[:n * struct.calcsize(fmt)])), o

def _prop(data, o):
    c = chr(data[o]); o += 1
    if c == 'Y': return struct.unpack_from('<h', data, o)[0], o + 2
    if c == 'C': return bool(data[o]), o + 1
    if c == 'I': return struct.unpack_from('<i', data, o)[0], o + 4
    if c == 'F': return struct.unpack_from('<f', data, o)[0], o + 4
    if c == 'D': return struct.unpack_from('<d', data, o)[0], o + 8
    if c == 'L': return struct.unpack_from('<q', data, o)[0], o + 8
    if c in 'fdlib': return _arr(data, o, c)
    if c in 'SR':
        n = struct.unpack_from('<I', data, o)[0]; o += 4
        v = data[o:o + n]; o += n
        return (v.decode('utf-8', 'replace') if c == 'S' else v), o
    raise ValueError('bad prop type %r at %d' % (c, o - 1))

def _node(data, o, wide):
    if wide:
        end, nprops, plen = struct.unpack_from('<QQQ', data, o); o += 24
    else:
        end, nprops, plen = struct.unpack_from('<III', data, o); o += 12
    nl = data[o]; o += 1
    if end == 0:
        return None, o
    name = data[o:o + nl].decode('ascii', 'replace'); o += nl
    props = []
    for _ in range(nprops):
        v, o = _prop(data, o); props.append(v)
    kids = []
    while o < end:
        k, o2 = _node(data, o, wide)
        if k is None:
            o = o2; break
        kids.append(k); o = o2
    return (name, props, kids), end

def parse(path):
    data = open(path, 'rb').read()
    assert data[:20] == b'Kaydara FBX Binary  ', 'not a binary FBX'
    ver = struct.unpack_from('<I', data, 23)[0]; wide = ver >= 7500
    o = 27; out = []
    while o < len(data):
        n, o2 = _node(data, o, wide)
        if n is None:
            break
        out.append(n); o = o2
    return ver, out

def find(nodes, name):
    return [n for n in nodes if n[0] == name]

def dump(nodes, depth=0, maxd=3, limit=6):
    for n in nodes[:limit if depth else 999]:
        ps = [p if not isinstance(p, (list, bytes)) else ('<%d>' % len(p)) for p in n[1]][:8]
        print('  ' * depth + n[0], ps)
        if depth < maxd:
            dump(n[2], depth + 1, maxd, limit)
