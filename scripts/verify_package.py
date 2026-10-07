#!/usr/bin/env python3
"""Check snapshot integrity and declared model storage, without dependencies."""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise SystemExit('FAIL: ' + message)


def main():
    checksum_file = ROOT / 'SHA256SUMS'
    require(checksum_file.is_file(), 'SHA256SUMS is missing')
    count = 0
    for line in checksum_file.read_text().splitlines():
        expected, relative = line.split('  ', 1)
        path = ROOT / relative
        require(path.is_file(), 'Missing file: ' + relative)
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        require(actual == expected, 'Checksum mismatch: ' + relative)
        count += 1
    package = json.loads((ROOT / 'package.json').read_text())
    lock = json.loads((ROOT / 'package-lock.json').read_text())
    for key in ('dependencies', 'devDependencies'):
        require(package.get(key, {}) == lock['packages'][''].get(key, {}),
                'package.json and package-lock.json differ in ' + key)
    sizes = {'float32': 4, 'int32': 4, 'bool': 1, 'uint8': 1, 'uint16': 2}
    for model in ('model', 'yolov8_model'):
        folder = ROOT / 'public' / model
        spec = json.loads((folder / 'model.json').read_text())
        for group in spec['weightsManifest']:
            expected = 0
            for weight in group['weights']:
                dtype = weight.get('quantization', {}).get('dtype', weight['dtype'])
                require(dtype in sizes, 'Unsupported weight dtype: ' + dtype)
                expected += math.prod(weight['shape']) * sizes[dtype]
            paths = [folder / name for name in group['paths']]
            require(all(p.is_file() for p in paths), 'Missing shard in ' + model)
            actual = sum(p.stat().st_size for p in paths)
            require(actual == expected,
                    f'{model} weight size: expected {expected}, found {actual}')
        print('PASS: ' + model + ' model shard sizes')
    print(f'PASS: {count} file checksums and root dependency declarations')
    print('Integrity checks do not execute inference or validate study results.')


if __name__ == '__main__':
    main()
