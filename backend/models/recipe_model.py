from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class RecipeDataset(Base):
    __tablename__ = 'recipes_dataset'

    RCP_SNO = Column(Integer, primary_key=True)
    RCP_TTL = Column(Text, nullable=True)
    CKG_NM = Column(Text, nullable=True)
    RGTR_ID = Column(Text, nullable=True)
    RGTR_NM = Column(Text, nullable=True)
    INQ_CNT = Column(Integer, nullable=True)
    RCMM_CNT = Column(Integer, nullable=True)
    SRAP_CNT = Column(Integer, nullable=True)
    CKG_MTH_ACTO_NM = Column(Text, nullable=True)
    CKG_STA_ACTO_NM = Column(Text, nullable=True)
    CKG_MTRL_ACTO_NM = Column(Text, nullable=True)
    CKG_KND_ACTO_NM = Column(Text, nullable=True)
    CKG_IPDC = Column(Text, nullable=True)
    CKG_MTRL_CN = Column(Text, nullable=True)
    CKG_INBUN_NM = Column(Text, nullable=True)
    CKG_DODF_NM = Column(Text, nullable=True)
    CKG_TIME_NM = Column(Text, nullable=True)
    FIRST_REG_DT = Column(Text, nullable=True)

