# cmcut-epgstation
CMカットを自動で実施するEpgstationをDocker Imageとして管理  
ref. https://tobitti.net/blog/Ubuntu-EPGStation_v2-JoinLogoScpTrial/  
jlseが拡張子`.ts`のみに対応していたため、録画時のファイルの拡張子を`.m2ts`から`.ts`に修正してある。  

## build
```
$ git clone https://github.com/requrd/cmcut.git
$ git submocdule init
$ git submodule update
$ docker build . -t cmcut
```