"""Synthetic CPU plumbing benchmark; produces no biometric accuracy metrics."""
import sys,json,time,resource,hashlib
from pathlib import Path
import numpy as np
import openvino as ov
import onnxruntime as ort
sys.path.insert(0,str(Path(__file__).parents[1]))
from pad_mn3 import ExperimentalMn3Pad,preprocess,validate_output,SHA256
root=Path(sys.argv[1]); path=root/'anti-spoof-mn3.onnx'
assert hashlib.sha256(path.read_bytes()).hexdigest()==SHA256, 'PAD_CHECKSUM_MISMATCH'
rng=np.random.default_rng(42)
patterns=[np.zeros((128,128,3),np.uint8),np.full((128,128,3),255,np.uint8),np.full((128,128,3),[10,30,90],np.uint8),rng.integers(0,256,(128,128,3),dtype=np.uint8)]
patterns += [np.tile(np.arange(128,dtype=np.uint8)[None,:,None]*2,(128,1,3)),np.repeat(((np.indices((128,128)).sum(0)%2)*255).astype(np.uint8)[:,:,None],3,axis=2)]
opts=ort.SessionOptions(); opts.intra_op_num_threads=1; opts.inter_op_num_threads=1
original=ort.InferenceSession(str(path),sess_options=opts,providers=['CPUExecutionProvider'])
core=ov.Core(); model=core.read_model(str(path))
# Convert to IR without FP16 compression; explicit preprocessing remains identical.
ov.save_model(model,str(root/'mn3-fp32.xml'),compress_to_fp16=False)
converted=core.compile_model(str(root/'mn3-fp32.xml'),'CPU',{'INFERENCE_NUM_THREADS':1,'NUM_STREAMS':1,'INFERENCE_PRECISION_HINT':'f32'})
from openvino.preprocess import PrePostProcessor, ColorFormat
pp=PrePostProcessor(core.read_model(str(path)))
pp.input().tensor().set_element_type(ov.Type.u8).set_layout(ov.Layout('NHWC')).set_color_format(ColorFormat.BGR)
pp.input().model().set_layout(ov.Layout('NCHW'))
pp.input().preprocess().convert_color(ColorFormat.RGB).convert_element_type(ov.Type.f32).mean([151.2405,119.5950,107.8395]).scale([63.0105,56.4570,55.0035])
ov.save_model(pp.build(),str(root/'mn3-bgr-fp32.xml'),compress_to_fp16=False)
bgr_model=core.compile_model(str(root/'mn3-bgr-fp32.xml'),'CPU',{'INFERENCE_NUM_THREADS':1,'NUM_STREAMS':1,'INFERENCE_PRECISION_HINT':'f32'})
parity=[]
bgr_parity=[]
for crop in patterns:
    x=preprocess(crop); a=original.run(None,{'actual_input_1':x})[0]; b=converted([x])[converted.output(0)]
    validate_output(a); validate_output(b)
    parity.append(float(np.max(np.abs(a-b))))
    c=bgr_model([crop[None]])[bgr_model.output(0)]
    validate_output(c); bgr_parity.append(float(np.max(np.abs(a-c))))
assert max(parity+bgr_parity)<1e-4,(parity,bgr_parity)
runs=[]
for threads in [1,2,4]:
    start=time.perf_counter(); p=ExperimentalMn3Pad(path,threads=threads); load=(time.perf_counter()-start)*1000
    assert p.error is None,p.error
    for i in range(10): p.measure(patterns[i%len(patterns)])
    timings=[]
    for i in range(100):
        start=time.perf_counter(); p.measure(patterns[i%len(patterns)]); timings.append((time.perf_counter()-start)*1000)
    assert p.assess(patterns[0]).decision=='NOT_EVALUATED'
    runs.append({'threads':threads,'load_compile_ms':load,'samples':len(timings),'warmup':10,'p50_ms':float(np.percentile(timings,50)),'p95_ms':float(np.percentile(timings,95)),'min_ms':min(timings),'max_ms':max(timings)})
report={'synthetic_only':True,'accuracy_evaluated':False,'model_sha256':SHA256,'input_patterns':6,'parity_onnxruntime_vs_openvino_fp32_max_abs':max(parity),'per_pattern_max_abs':parity,'converted_bgr_baked_preprocessing_max_abs':max(bgr_parity),'latency_includes':'validation, BGR-to-RGB normalization, async CPU inference, output validation; excludes face detection/crop/network','runs':runs,'process_peak_rss_kib':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,'versions':{'openvino':ov.__version__,'onnxruntime':ort.__version__,'numpy':np.__version__}}
(root/'benchmark.json').write_text(json.dumps(report,indent=2)+'\n'); print(json.dumps(report,indent=2))
