;----------------------------------------------;
;                                              ;
;      TOOLS.BSH - Include-File !!             ;
;                                              ;
;----------------------------------------------;

;===========Blocknummern und Farbcodes=========;

  BLK_TOOL =    0
  BLK_BAUHAUS = 3
  BLK_BAUSHIP = 4

  ZEINR =       0
	ZEILITTLE =		1
  ZEILARGE =    2

  COL_WHT =     255
  COL_RED =     249
  COL_BLK =     0
  COL_BALK =    185

;=============Position der Grafiken============;

  GFXTAFEL    = 0
  GFXPFEIL    = GFXTAFEL+1
  GFXPLUS     = GFXPFEIL+4
  GFXMAIN     = GFXPLUS+4
	GFXMAP			= GFXMAIN+8
  GFXHAUS     = GFXMAP+5
  GFXPFEILH   = GFXHAUS+18
  GFXBAUMAT   = GFXPFEILH+6
  GFXBAUHAUS  = GFXBAUMAT+35
  GFXMENU     = GFXBAUHAUS+87
  GFXOVERHEAD = GFXMENU+3
  GFXPFEILV   = GFXOVERHEAD+5
  GFXMENGE    = GFXPFEILV+4
  GFXWARELEER = GFXMENGE+8
  GFXWARE =     GFXWARELEER+4
  GFXKONT =     GFXWARE+41
  GFXLEISTE   = GFXKONT+20
	GFXSIED     = GFXLEISTE+57
	GFXSIEDFACE	=	GFXSIED+9
	GFXSIEDINFR	= GFXSIEDFACE+20
	GFXSIEDNAHR = GFXSIEDINFR+16
	GFXPROD     = GFXSIEDNAHR+2
	GFXSHIP			= GFXPROD+6
	GFXWERFT		= GFXSHIP+39
	GFXMILIT		= GFXWERFT+15
	GFXSTADT		= GFXMILIT+18
	GFXTRANS		= GFXSTADT+14
  GFXOPTION   = GFXTRANS+12
  GFXKAMPF    = GFXOPTION+52
  GFXPIRAT    = GFXKAMPF+30
  GFXVERTRAG  = GFXPIRAT+20
  GFXINFO     = GFXVERTRAG+34
  GFXROUTE    = GFXINFO+8
  GFXTRADER   = GFXROUTE+11
  GFXSHIPLIST = GFXTRADER+4
  GFXLAGER    = GFXSHIPLIST+14
  GFXTUTOR    = GFXLAGER+11
  GFXBUBBLE   = GFXTUTOR+7

;=============Ende des Include-Files===========;
