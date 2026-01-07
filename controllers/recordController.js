const dailyRecordService = require( "../services/dailyRecordService");

const openDailyRecord = async (req, res) => {
  try {
    const result = await dailyRecordService.openDailyRecord();

    return res.status(200).json({
      success: true,
      message: result.alreadyOpen 
        ? "Daily record already open for today." 
        : "Daily record opened successfully.",
      data: result.record
    });

  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

 const closeDailyRecord = async (req, res) => {
  try {
    const record = await dailyRecordService.closeDailyRecord();

    return res.status(200).json({
      success: true,
      message: "Daily record closed successfully.",
      data: record
    });

  } catch (error) {
    return res.status(400).json({ success: false, message:error });
  }
};

 const getActiveDailyRecord = async (req, res) => {
  try {
    const record = await dailyRecordService.getActiveRecord();
    
    if (!record) return res.status(404).json({
      success: false,
      message: "No active daily record."
    });

    return res.json({ success: true, data: record });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

 const getDailyRecordById = async (req, res) => {
  try {
    const record = await dailyRecordService.getDailyRecordById(req.params.id);

    if (!record) {

      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.json({ success: true, data: record });

  } catch (error) {
    console.log("error"+ error)
    return res.status(500).json({ success: false, message: error });
  }
};

 const listDailyRecords = async (req, res) => {
  try {
    const data = await dailyRecordService.listDailyRecords(req.query);
    return res.json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Force recalculation manually (admin-only)
 const recalcDailyRecordTotals = async (req, res) => {
  try {
    const record = await dailyRecordService.recalcTotalsForRecord(req.params.id);

    return res.json({
      success: true,
      message: "Totals recalculated successfully",
      data: record
    });

  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const checkTodayRecordStatus = async (req, res) => {
  try {
    const status = await dailyRecordService.checkTodayRecordStatus();

    return res.json({
      success: true,
      ...status
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const fetchTodaysRecord = async (req, res) => {
  try {
    const record = await dailyRecordService.fetchTodaysRecord();

    if (!record) {
      return res.json({
        success: true,
        exists: false,
        message: "No daily record found for today."
      });
    }

    return res.json({
      success: true,
      exists: true,
      data: record
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reopenTodaysRecord = async (req, res) => {
  try {
    const {user_id, reason } = req.body;
    const userId = req.body.user_id; // admin / supervisor

    const result = await dailyRecordService.reopenTodaysRecord({
      userId,
      reason
    });

    return res.json({
      success: true,
      message: result.alreadyOpen
        ? "Daily record is already open."
        : "Daily record reopened successfully.",
      data: result.record
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};




module.exports ={recalcDailyRecordTotals,listDailyRecords,getDailyRecordById,getActiveDailyRecord,closeDailyRecord,openDailyRecord,fetchTodaysRecord,checkTodayRecordStatus,reopenTodaysRecord};