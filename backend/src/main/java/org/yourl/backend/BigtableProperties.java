package org.yourl.backend;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "yourl.bigtable")
public class BigtableProperties {
    private String projectId = "you-rl-demo";
    private String instanceId = "you-rl-instance";
    private String tableId = "urls";
    private String metaFamily = "meta";
    private String statsFamily = "stats";
    private int shortCodeLength = 7;
    private int maxGenerationAttempts = 8;
    //User account fields
    private String usersTableId = "users";
    private String userInfoFamily = "info";

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getInstanceId() {
        return instanceId;
    }

    public void setInstanceId(String instanceId) {
        this.instanceId = instanceId;
    }

    public String getTableId() {
        return tableId;
    }

    public void setTableId(String tableId) {
        this.tableId = tableId;
    }

    public String getMetaFamily() {
        return metaFamily;
    }

    public void setMetaFamily(String metaFamily) {
        this.metaFamily = metaFamily;
    }

    public String getStatsFamily() {
        return statsFamily;
    }

    public void setStatsFamily(String statsFamily) {
        this.statsFamily = statsFamily;
    }

    public int getShortCodeLength() {
        return shortCodeLength;
    }

    public void setShortCodeLength(int shortCodeLength) {
        this.shortCodeLength = shortCodeLength;
    }

    public int getMaxGenerationAttempts() {
        return maxGenerationAttempts;
    }

    public void setMaxGenerationAttempts(int maxGenerationAttempts) {
        this.maxGenerationAttempts = maxGenerationAttempts;
    }

    //User account getters and setters
    public String getUsersTableId() { 
        return usersTableId; 
    }

    public void setUsersTableId(String usersTableId) { 
        this usersTableId = usersTableId; 
    }

    public String getUserInfoFamily() { 
        return userInfoFamily; 
    }
    
    public void setUserInfoFamily(String userInfoFamily) { 
        this.userInfoFamily = userInfoFamily; 
    }
}
