package com.project.gmaking.pve.dao;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import com.project.gmaking.pve.vo.EncounterRateVO;

@Mapper
public interface EncounterRateDAO {
    List<EncounterRateVO> getEncounterRates();
}
