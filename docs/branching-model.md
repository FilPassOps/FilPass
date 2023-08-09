# Branching model

We use the development branch as the base for all of our new features. From development, we merge the changes into release-candidate and then to production.


The idea is to use the production branch as the base for our new feature branches and then have individual merges from the feature branch to development, release-candidate, and production.

With this approach, we mitigate merge problems when we have a hotfix or a feature is rejected. Also, work in development won't affect new production releases as it does right now.

```mermaid
%%{init: { 'theme': 'base' } }%%
      gitGraph
        commit
        
        branch release-candidate order: 1
        
        checkout main
        checkout release-candidate
        commit

        branch develop order: 3
        checkout develop

        checkout release-candidate
        branch hotfixY order: 3
        checkout hotfixY
        commit

        checkout release-candidate
        merge hotfixY
        
        checkout main
        merge release-candidate tag:"release 1.0.1"
        
        checkout develop
        merge release-candidate


        branch featureA order: 5
        checkout featureA
        commit
        commit

        checkout develop
        branch featureB order: 6
        checkout featureB
        commit
        commit

        checkout release-candidate
        
        branch hotfixZ order: 3
        checkout hotfixZ
        commit
        checkout release-candidate
        merge hotfixZ
        checkout main
        merge release-candidate tag:"release 1.0.2"

        checkout featureA
        checkout develop
        merge featureA

        checkout develop
        branch bug1 order: 7
        checkout bug1
        commit
        checkout develop
        merge bug1

        checkout develop
        merge featureA

        checkout release-candidate
        merge develop
        checkout main
        merge release-candidate tag:"release 1.1"

        checkout featureB
        merge develop
        commit
        checkout develop
        merge featureB

        checkout release-candidate
        merge develop
        checkout main
        merge release-candidate tag:"release 1.2"
```
