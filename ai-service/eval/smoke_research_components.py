"""Component execution only. Random texture is NOT a face or an accuracy trial."""
import os,sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]))
import cv2,numpy as np
from face_models import load_face_models
from pad_mn3 import ExperimentalMn3Pad
models=load_face_models(os.environ['FACE_RESEARCH_MODEL_DIR'])
assert models.error_code is None, models.error_code
pad=ExperimentalMn3Pad(os.environ['FACE_RESEARCH_PAD_MODEL'])
assert pad.error is None,pad.error
noise=np.random.default_rng(37).integers(0,256,(160,160,3),dtype=np.uint8)
models.detector.setInputSize((160,160));_,faces=models.detector.detect(noise)
assert faces is None or len(faces)==0,'Unexpected detection: do not treat texture as a positive face'
# Explicit fixture landmarks exercise alignCrop, not a YuNet detection or enrollment.
fixture=np.array([10,10,120,120,45,50,105,50,75,80,50,110,100,110,.99],np.float32)
aligned=models.recognizer.alignCrop(noise,fixture)
feature=models.recognizer.feature(aligned)
assert feature.shape==(1,128) and np.isfinite(feature).all()
score=float(models.recognizer.match(feature,feature,cv2.FaceRecognizerSF_FR_COSINE))
assert np.isfinite(score)
measurement=pad.measure(cv2.resize(noise[10:130,10:130],(128,128),interpolation=cv2.INTER_LINEAR))
assert pad.assess(np.zeros((128,128,3),np.uint8)).decision=='NOT_EVALUATED'
print(json.dumps({'syntheticOnly':True,'realYuNetNoFace':True,'realSfaceAlignmentAndEmbedding':True,'realMn3Inference':True,'identityFixtureLandmarks':True,'featureShape':list(feature.shape),'scoreFinite':True,'padOutputFinite':bool(np.isfinite([measurement.real_score,measurement.spoof_score]).all()),'biometricAccuracyMeasured':False,'authorized':False}))
