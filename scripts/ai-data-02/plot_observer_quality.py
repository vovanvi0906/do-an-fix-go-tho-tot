"""Standalone experiment figure and explicit-support CSV; not production accuracy."""
import csv,json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from evaluate_observer_challenge import OUT

def main():
    report=json.loads((OUT/'report.json').read_text());fig,axes=plt.subplots(1,2,figsize=(11,4.7));labels=['Precision','Recall','F1'];x=np.arange(3)
    for ax,suite,title in [(axes[0],'reservedCrack','Nứt: 59 ảnh giữ riêng'),(axes[1],'clean','Nhiều dấu hiệu: 27 ảnh đã rà')]:
        for i,version in enumerate(['v2','v3']):
            values=[100*report['results'][version][suite]['pooledScoped'][k] for k in ['precision','recall','F1']]
            bars=ax.bar(x+(i-.5)*.34,values,.34,label=version,color=['#2563eb','#d97706'][i]);ax.bar_label(bars,fmt='%.1f',padding=3,fontsize=8)
        ax.set_xticks(x,labels);ax.set_ylim(0,105);ax.set_ylabel('%');ax.set_title(title);ax.legend();ax.grid(axis='y',alpha=.2);ax.set_axisbelow(True)
    fig.text(.5,.02,'Nhãn AI/nguồn; khung bao là xấp xỉ. Test nứt chỉ có ảnh dương. Không phải xác nhận chất lượng production.',ha='center',fontsize=9);fig.tight_layout(rect=(0,.06,1,1));fig.savefig(OUT/'quality-comparison.png',dpi=180);plt.close(fig)
    with (OUT/'per-sign-results.csv').open('w') as f:
        writer=csv.writer(f);writer.writerow(['version','suite','code','scoredImages','positiveImages','TP','FP','FN','precision','recall','F1','negativeScopeImages','negativeScopeImagesWithAlerts'])
        for version,data in report['results'].items():
            for suite in ['clean','watermarkedDiagnostic','reservedCrack']:
                for code,p in data[suite]['perClass'].items():writer.writerow([version,suite,code,p['scoredImages'],p['positiveImages'],p['TP'],p['FP'],p['FN'],p['precision'] if p['TP']+p['FP'] else '',p['recall'] if p['TP']+p['FN'] else '',p['F1'],p['negativeImages'],p['negativeImagesWithAlerts']])
    print(OUT/'quality-comparison.png')
if __name__=='__main__':main()
