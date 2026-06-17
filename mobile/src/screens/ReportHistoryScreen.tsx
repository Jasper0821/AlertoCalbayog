import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, DeviceEventEmitter } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import { FireIcon, MedicalIcon, CrimeIcon, FloodIcon, OthersIcon, TrashIcon } from "../components/SvgIcons";

interface Report {
  _id: string;
  emergencyType: string;
  status: string;
  assignedAgency?: string;
  createdAt?: string;
  assignedResponder?: {
    fullName: string;
    phoneNumber?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

export default function ReportHistoryScreen(): React.JSX.Element {
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchMyReports();

    // Listen for real-time status updates from the socket listener
    const subscription = DeviceEventEmitter.addListener("reportStatusUpdated", (notif) => {
      console.log("📡 ReportHistoryScreen received status update, refreshing reports...");
      fetchMyReports();
    });

    return () => {
      subscription.remove();
    };
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
      case 'resolved':
      case 'responded': return { border: 'border-green', text: 'text-green', bg: 'bg-green/10' };
      case 'responding':
      case 'active': return { border: 'border-blue', text: 'text-blue', bg: 'bg-blue/10' };
      case 'verified': return { border: 'border-purple', text: 'text-purple', bg: 'bg-purple/10' };
      case 'pending': return { border: 'border-primary', text: 'text-primary', bg: 'bg-primary/10' };
      default: return { border: 'border-textGray', text: 'text-textGray', bg: 'bg-textGray/10' };
    }
  };

  const getIncidentConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case "fire":
        return {
          icon: <FireIcon size={28} />,
          color: "#EF4444",
          bgColor: "rgba(239, 68, 68, 0.08)",
          label: "Fire Incident",
        };
      case "medical":
        return {
          icon: <MedicalIcon size={28} />,
          color: "#10B981",
          bgColor: "rgba(16, 185, 129, 0.08)",
          label: "Medical Emergency",
        };
      case "crime":
        return {
          icon: <CrimeIcon size={28} />,
          color: "#8B5CF6",
          bgColor: "rgba(139, 92, 246, 0.08)",
          label: "Crime Incident",
        };
      case "flood":
        return {
          icon: <FloodIcon size={28} />,
          color: "#0EA5E9",
          bgColor: "rgba(14, 165, 233, 0.08)",
          label: "Flood Incident",
        };
      default:
        return {
          icon: <OthersIcon size={28} />,
          color: "#F59E0B",
          bgColor: "rgba(245, 158, 11, 0.08)",
          label: type ? type.toUpperCase() : "Emergency Incident",
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Report History" showBack />

      {reports.length > 0 && (
        <View className="px-5 py-4">
          <Text className="text-primary/70 text-sm font-black uppercase tracking-wider">
            Submitted Reports ({reports.length})
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerClassName="p-5 pt-0 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A1E3F" />
        }
      >
        {reports.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20 px-8">
            <View className="w-16 h-16 rounded-3xl bg-surface border border-border items-center justify-center mb-4">
              <Text className="text-2xl">📋</Text>
            </View>
            <Text className="text-primary text-lg font-bold text-center">No reports found</Text>
            <Text className="text-textGray text-sm text-center mt-2">
              Any emergency reports you submit will appear here.
            </Text>
          </View>
        ) : (
          reports.map((report) => {
            const { border, text, bg } = getStatusConfig(report.status);
            const incident = getIncidentConfig(report.emergencyType);
            const isLiveTrackable = ["pending", "verified", "responding", "active"].includes(report.status?.toLowerCase());
            
            return (
              <TouchableOpacity
                key={report._id}
                onLongPress={() => handleDeleteReport(report._id)}
                delayLongPress={600}
                activeOpacity={0.9}
                className="mb-4"
              >
                <View className="bg-surface rounded-3xl overflow-hidden border border-border shadow-sm">
                  {/* Left accent strip colored by incident type */}
                  <View className="h-1.5 w-full" style={{ backgroundColor: incident.color }} />
                  
                  <View className="p-5">
                    {/* Header Row: Icon + Incident Label / Date + Status Badge */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: incident.bgColor }}>
                          {incident.icon}
                        </View>
                        <View className="flex-1">
                          <Text className="text-primary text-base font-black tracking-tight" numberOfLines={1}>
                            {incident.label}
                          </Text>
                          <Text className="text-textGray text-[11px] font-semibold mt-0.5">
                            {formatDate(report.createdAt)}
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View className={`px-2.5 py-1 rounded-xl border ${border} ${bg}`}>
                        <Text className={`text-[10px] font-black uppercase tracking-wider ${text}`}>
                          {report.status || 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {/* Content Section: location and agency details */}
                    <View className="bg-background/40 p-4 rounded-2xl border border-border/40 mb-4 gap-3">
                      {/* Location Row */}
                      <View className="flex-row items-start">
                        <Text className="text-sm mr-2.5">📍</Text>
                        <View className="flex-1">
                          <Text className="text-textGray text-[9px] font-black uppercase tracking-wider mb-0.5">Location</Text>
                          <Text className="text-primary text-xs font-bold" numberOfLines={2}>
                            {report.location?.name || `Coordinates: ${report.location?.latitude?.toFixed(4)}, ${report.location?.longitude?.toFixed(4)}`}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Agency Row */}
                      <View className="flex-row items-start">
                        <Text className="text-sm mr-2.5">🏢</Text>
                        <View className="flex-1">
                          <Text className="text-textGray text-[9px] font-black uppercase tracking-wider mb-0.5">Assigned Agency</Text>
                          <Text className="text-primary text-xs font-bold">
                            {report.assignedAgency && report.assignedAgency !== "NONE" ? report.assignedAgency : "CDRRMO (Command Center)"}
                          </Text>
                        </View>
                      </View>

                      {/* Responder Row (If Assigned) */}
                      {report.assignedResponder && (
                        <View className="flex-row items-start">
                          <Text className="text-sm mr-2.5">👤</Text>
                          <View className="flex-1">
                            <Text className="text-textGray text-[9px] font-black uppercase tracking-wider mb-0.5">Assigned Responder</Text>
                            <Text className="text-primary text-xs font-bold">
                              {report.assignedResponder.fullName}
                              {report.assignedResponder.phoneNumber ? ` (${report.assignedResponder.phoneNumber})` : ''}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Actions Row */}
                    <View className="flex-row items-center justify-between mt-1">
                      {/* Stylized Delete Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteReport(report._id)}
                        className="flex-row items-center py-2 px-4 rounded-xl bg-red/5 border border-red/10"
                        activeOpacity={0.7}
                      >
                        <TrashIcon size={14} color="#B91C1C" />
                        <Text className="text-red font-black text-xs uppercase tracking-wider ml-2">Delete</Text>
                      </TouchableOpacity>

                      {/* Track Live button (conditional) */}
                      {isLiveTrackable && (
                        <TouchableOpacity
                          onPress={() => navigation.navigate("LiveTracking", {
                            reportId: report._id,
                            latitude: report.location?.latitude || 12.0645,
                            longitude: report.location?.longitude || 124.595,
                            emergencyType: report.emergencyType,
                            reportStatus: report.status,
                          })}
                          className="flex-row items-center py-2.5 px-4 rounded-xl bg-primary shadow-sm"
                          activeOpacity={0.8}
                        >
                          <Text className="text-white font-black text-xs uppercase tracking-wider mr-1.5">Track Live</Text>
                          <Text className="text-white text-xs font-black">→</Text>
                        </TouchableOpacity>
                      )}
                    </View>
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
