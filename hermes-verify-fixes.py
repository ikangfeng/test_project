#!/usr/bin/env python3
import sys, os, json
sys.path.insert(0, '/Users/feng/countdown-project/backend')
from services.countdown_service import get_countdown_service, CountdownService
from schemas.countdown import CountdownStatus, CountdownResponse
from routers.countdown import router

results = []
def check(name):
    def deco(fn):
        try:
            fn()
            results.append(True)
            print(f'PASS ({len(results)}): {name}')
        except Exception as e:
            results.append(False)
            print(f'FAIL ({len(results)}): {name} — {e}')
    return deco

@check('singleton returns same instance (eager init)')
def _():
    s1 = get_countdown_service(); s2 = get_countdown_service()
    assert s1 is s2; assert isinstance(s1, CountdownService)

@check('CountdownResponse inherits CountdownStatus')
def _():
    assert issubclass(CountdownResponse, CountdownStatus)

@check('field parity Status vs Response')
def _():
    assert set(CountdownResponse.model_fields.keys()) == {'remaining', 'is_running'}

@check('JSON serialization identical')
def _():
    s = CountdownStatus(remaining=30, is_running=True)
    r = CountdownResponse(remaining=30, is_running=True)
    assert json.loads(s.model_dump_json()) == json.loads(r.model_dump_json())

@check('COUNTDOWN_API_URL in index.html before api.js')
def _():
    h = open('/Users/feng/countdown-project/frontend/public/index.html').read()
    assert 'window.COUNTDOWN_API_URL' in h
    assert h.index('window.COUNTDOWN_API_URL') < h.index('js/api.js')

@check('all routes use CountdownResponse as response_model')
def _():
    for r in router.routes:
        rm = getattr(r, 'response_model', None)
        if rm is not None:
            assert rm.__name__ == 'CountdownResponse', f'{r.path} -> {rm.__name__}'

p = sum(results)
print(f'\n=== {p}/{len(results)} PASSED ===')
sys.exit(0 if all(results) else 1)
