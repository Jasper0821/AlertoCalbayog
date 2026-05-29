import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import Header from "../components/Header";
import api from "../api/axios";
import { getToken } from "../utils/Storage";

interface Report {
  _id: string;
  emergencyType: string;
  status: string;
  assignedAgency?: string;
  createdAt?: string;
}

export default function ReportHistoryScreen(): React.JSX.Element {
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const token = await getToken();

      // Fetch only reports belonging to the currently logged-in user
      const res = await api.get("/emergency/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReports(res.data);
    } catch (error: any) {
      console.log(error.response?.data || error.message);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyReports();
    setRefreshing(false);
  }, []);

  const handleDeleteReport = (reportId: string) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report from your history?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();

              await api.delete(`/emergency/${reportId}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              // Remove the deleted report from the local state
              setReports((prev) => prev.filter((r) => r._id !== reportId));
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to delete report"
              );
            }
          }
        }
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return { border: 'border-green', text: 'text-green', bg: 'bg-green/10' };
      case 'responding': return { border: 'border-blue', text: 'text-blue', bg: 'bg-blue/10' };
      case 'pending': return { border: 'border-primary', text: 'text-primary', bg: 'bg-primary/10' };
      default: return { border: 'border-textGray', text: 'text-textGray', bg: 'bg-textGray/10' };
    }
  };

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Report History" showBack />

      <ScrollView
        contentContainerClassName="p-5 pt-0 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {reports.length === 0 ? (
          <Text className="text-textGray text-center mt-10 text-base">No emergency reports found.</Text>
        ) : (
          reports.map((report) => {
            const { border, text, bg } = getStatusConfig(report.status);
            
            return (
              <TouchableOpacity
                key={report._id}
                onLongPress={() => handleDeleteReport(report._id)}
                delayLongPress={600}
                activeOpacity={0.85}
              >
                <View className="bg-surface rounded-3xl p-5 mb-4 border border-border shadow-2xl shadow-black">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white text-lg font-black tracking-tight">{report.emergencyType.toUpperCase()}</Text>
                    <View className={`px-3 py-1 rounded-xl border ${border} ${bg}`}>
                      <Text className={`text-[10px] font-black uppercase ${text}`}>
                        {report.status || 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View className="h-[1px] bg-border mb-4" />
                  
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-2xl bg-darkBlue items-center justify-center mr-3 border border-border">
                      <Text className="text-base">🏢</Text>
                    </View>
                    <View>
                      <Text className="text-textGray text-[10px] font-black uppercase tracking-widest mb-0.5">Assigned Agency</Text>
                      <Text className="text-white text-sm font-bold">
                        {report.assignedAgency || "Awaiting Assignment"}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3">
                    <Text className="text-textGray text-[10px] italic">Long press to delete</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}